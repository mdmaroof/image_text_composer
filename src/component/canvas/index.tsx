"use client";
import { AppContext, TextLayerType } from "@/context/AppContext";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

const HANDLE_SIZE = 8;
const ROTATE_HANDLE_OFFSET = 28;
const LINE_HEIGHT_FACTOR = 1.2;
const SNAP_THRESHOLD = 6;

const Canvas = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { textLayers, selectedLayer,setSelectedLayer,setTextLayers } = useContext(AppContext)!;

  const [img, setImg] = useState<HTMLImageElement | null>(null);

  const updateTextLayer = (id: number, updates: Partial<TextLayerType>) => {
    setTextLayers((prev: TextLayerType[]) => {
      return prev.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      );
    });
  };

  const handleFile = useCallback((file: File) => {
    // if (file.type !== "image/png") {
    //   alert("Please upload a PNG image.");
    //   return;
    // }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }, []);

  const createCanvasWithImage = useCallback(() => {
    if (!img || !wrapperRef.current || !canvasRef.current) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const maxW = wrapper.clientWidth;
    const maxH = wrapper.clientHeight;

    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const targetW = Math.max(1, Math.floor(img.naturalWidth * scale));
    const targetH = Math.max(1, Math.floor(img.naturalHeight * scale));

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(targetW * dpr);
    canvas.height = Math.round(targetH * dpr);
    canvas.style.width = `${targetW}px`;
    canvas.style.height = `${targetH}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }, [img]);

  const hitTestLayer = useCallback((
    x: number,
    y: number
  ): { layer: TextLayerType; zone: "body" | "resize" | "rotate" } | null => {
    if (!img) return null;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const cx = x - rect.left;
    const cy = y - rect.top;

    const ctx = canvas.getContext("2d");

    for (let i = textLayers.length - 1; i >= 0; i--) {
      const layer = textLayers[i];

      // Determine width used for layout (measured if not set)
      let width = layer.width || 0;
      let lineCount = Math.max(1, layer.text.split("\n").length);
      if (!width && ctx) {
        ctx.save();
        ctx.textBaseline = "top";
        ctx.font = `${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}"`;
        const paragraphs = layer.text.split("\n");
        let maxW = 0;
        for (const para of paragraphs) {
          const w = ctx.measureText(para).width;
          if (w > maxW) maxW = w;
        }
        width = maxW || 200;
        ctx.restore();
      }
      if (!width) width = 200;

      const height = layer.fontSize * LINE_HEIGHT_FACTOR * lineCount;

      // Axis-aligned body hit (approximate for rotated text)
      let tlx_world = layer.x;
      if (layer.align === "center") tlx_world = layer.x - width / 2;
      else if (layer.align === "right") tlx_world = layer.x - width;
      const tly_world = layer.y;
      const trx_world = tlx_world + width;
      const bry_world = tly_world + height;

      const withinAABB =
        cx >= tlx_world - 4 && cx <= trx_world + 4 && cy >= tly_world - 4 && cy <= bry_world + 4;

      // Compute handle world positions using rotation
      const angle = (layer.rotation * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const alignOffset = layer.align === "center" ? -width / 2 : layer.align === "right" ? -width : 0;

      const toWorld = (lx: number, ly: number) => {
        return {
          x: layer.x + (lx * cos - ly * sin),
          y: layer.y + (lx * sin + ly * cos),
        };
      };

      // Local handle positions (same as drawText)
      const resizeLocalX = alignOffset + width + 8;
      const resizeLocalY = height / 2;
      const rotateLocalX = alignOffset + width / 2;
      const rotateLocalY = -ROTATE_HANDLE_OFFSET;
      const resizeWorld = toWorld(resizeLocalX, resizeLocalY);
      const rotateWorld = toWorld(rotateLocalX, rotateLocalY);


      // Distance from point to rotated right edge segment
      const topRight = toWorld(alignOffset + width, 0);
      const bottomRight = toWorld(alignOffset + width, height);
      const px = cx, py = cy;
      const vx = bottomRight.x - topRight.x;
      const vy = bottomRight.y - topRight.y;
      const wx = px - topRight.x;
      const wy = py - topRight.y;
      const len2 = vx * vx + vy * vy || 1;
      let t = (wx * vx + wy * vy) / len2;
      t = Math.max(0, Math.min(1, t));
      const projx = topRight.x + t * vx;
      const projy = topRight.y + t * vy;
      const dist = Math.hypot(px - projx, py - projy);
      if (dist <= HANDLE_SIZE) {
        return { layer, zone: "resize" };
      }
      if (Math.hypot(cx - rotateWorld.x, cy - rotateWorld.y) <= HANDLE_SIZE) {
        return { layer, zone: "rotate" };
      }

      // Then check body (coarse AABB)
      if (withinAABB) {
        return { layer, zone: "body" };
      }
    }
    return null;
  }, [textLayers]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [initialPos, setInitialPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [action, setAction] = useState<"none" | "move" | "resize" | "rotate">("none");
  const [initialWidth, setInitialWidth] = useState<number | null>(null);
  const [initialRotation, setInitialRotation] = useState<number | null>(null);
  const [rotateCenter, setRotateCenter] = useState<{ x: number; y: number } | null>(null);
  const [startAngle, setStartAngle] = useState<number | null>(null);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if(!img) return
    const hit = hitTestLayer(e.clientX, e.clientY);
    if (hit) {
      setSelectedLayer(hit.layer.id as number);
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      if (hit.zone === "body") {
        setIsDragging(true);
        setDragStart({ x: cx, y: cy });
        setInitialPos({ x: hit.layer.x, y: hit.layer.y });

        const width = hit.layer.width || 200;
        let layerCenterX = hit.layer.x;
        if (hit.layer.align === "center") layerCenterX = hit.layer.x;
        else if (hit.layer.align === "right")
          layerCenterX = hit.layer.x - width / 2;
        else layerCenterX = hit.layer.x + width / 2;
        setDragOffset({ x: cx - layerCenterX, y: cy - hit.layer.y });
        setAction("move");
      } else if (hit.zone === "resize") {
        setDragStart({ x: cx, y: cy });
        setInitialWidth(hit.layer.width || 200);
        setAction("resize");
      } else if (hit.zone === "rotate") {

        const width = hit.layer.width || 200;
        let tlx = hit.layer.x;
        if (hit.layer.align === "center") tlx = hit.layer.x - width / 2;
        else if (hit.layer.align === "right") tlx = hit.layer.x - width;
        const centerX = tlx + width / 2;
        const centerY = hit.layer.y + (hit.layer.height || hit.layer.fontSize) / 2;
        setRotateCenter({ x: centerX, y: centerY });
        setInitialRotation(hit.layer.rotation || 0);

        const angle0 = Math.atan2(cy - centerY, cx - centerX);
        setStartAngle(angle0);
        setAction("rotate");
      } 
    } else {
      setSelectedLayer(null);
    }
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!img) return;
    if (action === "none") {
      const hit = hitTestLayer(e.clientX, e.clientY);
      if (canvasRef.current) {
        if (!hit) canvasRef.current.style.cursor = "default";
        else if (hit.zone === "resize") canvasRef.current.style.cursor = "ew-resize";
        else if (hit.zone === "rotate") canvasRef.current.style.cursor = "crosshair";
        else canvasRef.current.style.cursor = "move";
      }
    }

    const selectedTextLayer = textLayers.find(
      (layer) => layer.id === selectedLayer
    );
    if (!selectedTextLayer) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (action === "move" && isDragging && dragStart && initialPos) {
      let nx = initialPos.x + (cx - dragStart.x);
      let ny = initialPos.y + (cy - dragStart.y);


      const centerX = img!.width / 2;
      const centerY = img!.height / 2;
      const width = selectedTextLayer.width || 200;
      let layerCenterX = nx;
      if (selectedTextLayer.align === "center") layerCenterX = nx;
      else if (selectedTextLayer.align === "right") layerCenterX = nx - width / 2;
      else layerCenterX = nx + width / 2;
      const layerCenterY =
        ny + (selectedTextLayer.height || selectedTextLayer.fontSize) / 2;

      if (Math.abs(layerCenterX - centerX) <= SNAP_THRESHOLD) {
        if (selectedTextLayer.align === "center") nx = centerX;
        else if (selectedTextLayer.align === "right") nx = centerX + width / 2;
        else nx = centerX - width / 2;
      }
      if (Math.abs(layerCenterY - centerY) <= SNAP_THRESHOLD) {
        ny = centerY - (selectedTextLayer.height || selectedTextLayer.fontSize) / 2;
      }

      updateTextLayer(selectedTextLayer.id, { x: nx, y: ny });
    } else if (action === "resize" && dragStart && initialWidth !== null) {

      const dx = cx - dragStart.x;
      let newWidth = Math.max(20, initialWidth + dx);
      updateTextLayer(selectedTextLayer.id, { width: newWidth });
    } else if (action === "rotate" && rotateCenter && startAngle !== null && initialRotation !== null) {
      const angle = Math.atan2(cy - rotateCenter.y, cx - rotateCenter.x);
      const delta = angle - startAngle;
      let deg = initialRotation + (delta * 180) / Math.PI;

      if (deg >= 180) deg -= 360;
      if (deg < -180) deg += 360;
      updateTextLayer(selectedTextLayer.id, { rotation: deg });
    }
  }

  const onMouseUp = () => {
    if (isDragging || action !== "none") {
      setIsDragging(false);
      setDragStart(null);
      setInitialPos(null);
      setDragOffset(null);
      setInitialWidth(null);
      setInitialRotation(null);
      setRotateCenter(null);
      setStartAngle(null);
      setAction("none");
    }
  }

  const onMouseLeave = () => {
    onMouseUp();
  }

  const drawText = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    createCanvasWithImage();
    const ordered = [...textLayers].sort((a, b) => a.id - b.id);
    for (const layer of ordered) {
      const {
        x,
        y,
        fontFamily,
        fontSize,
        fontWeight,
        color,
        opacity,
        align,
        rotation,
        width,
      } = layer;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.textBaseline = "top";
      ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
      ctx.fillStyle = color;
      // Important: keep drawing in left-aligned local space and offset drawX manually for center/right
      ctx.textAlign = "left";

      const lines: string[] = [];
      const paragraphs = layer.text.split("\n");
      for (const para of paragraphs) {
        const words = para.split(/(\s+)/);
        let current = "";
        for (const w of words) {
          const test = current + w;
          const metrics = ctx.measureText(test);
          if (width && metrics.width > width && current.trim() !== "") {
            lines.push(current);
            current = w.trimStart();
          } else {
            current = test;
          }
        }
        lines.push(current);
      }

      const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
      const textBoxWidth =
        width || Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
      const textBoxHeight = Math.max(lineHeight * lines.length, fontSize);

      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let drawX = 0;
        if (align === "center") drawX = -textBoxWidth / 2;
        else if (align === "right") drawX = -textBoxWidth;
        const drawY = i * lineHeight;
        ctx.fillText(line, drawX, drawY, width || undefined);
      }

      if (selectedLayer && selectedLayer === layer.id) {
        ctx.save();
        ctx.setLineDash([4, 2]);
        ctx.strokeStyle = "rgba(59,130,246,0.9)";
        ctx.lineWidth = 2;

        let tlx = 0;
        if (align === "center") tlx = -textBoxWidth / 2;
        else if (align === "right") tlx = -textBoxWidth;
        const tly = 0;

        ctx.strokeRect(tlx - 4, tly - 4, textBoxWidth + 8, textBoxHeight + 8);

        // Resize handle (right side)
        const rx = tlx + textBoxWidth + 8;
        const ry = tly + textBoxHeight / 2;
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(
          rx - HANDLE_SIZE / 2,
          ry - HANDLE_SIZE / 2,
          HANDLE_SIZE,
          HANDLE_SIZE
        );

        // Rotate handle (top center)
        const rcx = tlx + textBoxWidth / 2;
        const rcy = tly - ROTATE_HANDLE_OFFSET;
        ctx.beginPath();
        ctx.arc(rcx, rcy, HANDLE_SIZE / 2 + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }

    const selectedtextLayer = textLayers.find((layer) => layer.id === selectedLayer);

    if (isDragging && selectedtextLayer && img) {
      const canvasCenterX = img.naturalWidth / 2;
      const canvasCenterY = img.naturalHeight / 2;
      const selectedCenterX =
      selectedtextLayer.x +
        (selectedtextLayer.align === "center"
          ? 0
          : selectedtextLayer.align === "right"
          ? -(selectedtextLayer.width || 0) / 2
          : (selectedtextLayer.width || 0) / 2);
      const selectedCenterY =
      selectedtextLayer.y + (selectedtextLayer.height || selectedtextLayer.fontSize) / 2;
      ctx.save();
      ctx.strokeStyle = "rgba(148,163,184,0.8)";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1;
      if (Math.abs(selectedCenterX - canvasCenterX) <= SNAP_THRESHOLD) {
        ctx.beginPath();
        ctx.moveTo(canvasCenterX, 0);
        ctx.lineTo(canvasCenterX, img!.height);
        ctx.stroke();
      }
      if (Math.abs(selectedCenterY - canvasCenterY) <= SNAP_THRESHOLD) {
        ctx.beginPath();
        ctx.moveTo(0, canvasCenterY);
        ctx.lineTo(img!.width, canvasCenterY);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [selectedLayer, textLayers, createCanvasWithImage]);

  useEffect(() => {
    drawText();
  }, [textLayers, drawText]);

  useEffect(() => {
    createCanvasWithImage();
  }, [img, createCanvasWithImage]);

  return (
    <main
      id="canvas"
      className="relative flex flex-col flex-1 items-center gap-4 p-4 border border-gray-300 rounded-md w-full h-full min-h-0 overflow-hidden"
    >
      <h1 className="font-bold text-xl">Canvas</h1>
      <section
        className="flex flex-1 justify-center items-center min-h-0"
        ref={wrapperRef}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          className="bg-white shadow-md border border-gray-100 rounded w-[720px] h-full"
        ></canvas>
      </section>

      <input
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        type="file"
      />
    </main>
  );
};

export default Canvas;
