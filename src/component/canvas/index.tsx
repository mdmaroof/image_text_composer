"use client";
import { AppContext, TextLayerType } from "@/context/AppContext";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Button from "@/component/common/Button";

const HANDLE_SIZE = 8;
const ROTATE_HANDLE_OFFSET = 28;
const LINE_HEIGHT_FACTOR = 1.2;
const SNAP_THRESHOLD = 6;

const Canvas = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resetInProgressRef = useRef(false);

  const { textLayers, selectedLayer, setSelectedLayer, setTextLayers, undo, redo, canUndo, canRedo, resetLayersAndHistory } = useContext(AppContext)!;

  const [img, setImg] = useState<HTMLImageElement | null>(null);

  const updateTextLayer = (id: number, updates: Partial<TextLayerType>) => {
    setTextLayers((prev: TextLayerType[]) => {
      return prev.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      );
    });
  };

  const handleFile = useCallback((file: File) => {
    if (file.type !== "image/png") {
      alert("Please upload a PNG image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        localStorage.setItem("itc:imageDataUrl", dataUrl);
      } catch (e) {
        console.error(e);
      }
      const image = new Image();
      image.onload = () => {
        setImg(image);
        // allow choosing the same file again later
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const createCanvasWithImage = useCallback(() => {
    if (!wrapperRef.current || !canvasRef.current) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const maxW = wrapper.clientWidth;
    const maxH = wrapper.clientHeight;

    const dpr = window.devicePixelRatio || 1;

    // If we're in the middle of reset, force white background once
    if (img && !resetInProgressRef.current) {
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      const targetW = Math.max(1, Math.floor(img.naturalWidth * scale));
      const targetH = Math.max(1, Math.floor(img.naturalHeight * scale));

      canvas.width = Math.round(targetW * dpr);
      canvas.height = Math.round(targetH * dpr);
      canvas.style.width = `${targetW}px`;
      canvas.style.height = `${targetH}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);
    } else {
      const targetW = Math.max(1, Math.floor(maxW));
      const targetH = Math.max(1, Math.floor(maxH));
      canvas.width = Math.round(targetW * dpr);
      canvas.height = Math.round(targetH * dpr);
      canvas.style.width = `${targetW}px`;
      canvas.style.height = `${targetH}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetW, targetH);
      // End reset mode only when there is no image in state
      if (!img) {
        resetInProgressRef.current = false;
      }
    }
  }, [img]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );

  const drawText = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // During reset or when no image, only render the white background once
    if (resetInProgressRef.current || !img) {
      createCanvasWithImage();
      return;
    }
    createCanvasWithImage();
    // draw in current array order to reflect layer move up/down
    for (const layer of (textLayers || [])) {
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

      // Always draw relative to top-left; alignment is handled via drawX
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
        // position inside the box based on align using measured line width
        const lineW = ctx.measureText(line).width;
        const boxW = width || textBoxWidth;
        let drawX = 0;
        if (align === "center") drawX = (boxW - lineW) / 2;
        else if (align === "right") drawX = boxW - lineW;
        const drawY = i * lineHeight;
        ctx.fillText(line, drawX, drawY, width || undefined);
      }

      if (selectedLayer && selectedLayer === layer.id) {
        ctx.save();
        ctx.setLineDash([4, 2]);
        ctx.strokeStyle = "rgba(59,130,246,0.9)";
        ctx.lineWidth = 2;

        // Selection box anchored at top-left of the text box
        const tlx = 0;
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

    const selectedtextLayer = textLayers?.find((layer) => layer.id === selectedLayer);

    if (isDragging && selectedtextLayer && img) {
      // Measure selected box for guideline alignment
      const cctx = canvasRef.current!.getContext("2d");
      let boxW = selectedtextLayer.width || 0;
      let boxH = selectedtextLayer.fontSize;
      if (cctx) {
        cctx.save();
        cctx.textBaseline = "top";
        cctx.font = `${selectedtextLayer.fontWeight} ${selectedtextLayer.fontSize}px "${selectedtextLayer.fontFamily}"`;
        const lines: string[] = [];
        const paragraphs = selectedtextLayer.text.split("\n");
        for (const para of paragraphs) {
          const words = para.split(/(\s+)/);
          let current = "";
          for (const w of words) {
            const test = current + w;
            const metrics = cctx.measureText(test);
            if (boxW && metrics.width > boxW && current.trim() !== "") {
              lines.push(current);
              current = w.trimStart();
            } else {
              current = test;
            }
          }
          lines.push(current);
        }
        const lineHeight = selectedtextLayer.fontSize * LINE_HEIGHT_FACTOR;
        boxW = boxW || Math.max(...lines.map((l) => cctx.measureText(l).width), 0) || 200;
        boxH = Math.max(lineHeight * lines.length, selectedtextLayer.fontSize);
        cctx.restore();
      }

      const rectCanvas = canvasRef.current!.getBoundingClientRect();
      const canvasCenterX = rectCanvas.width / 2;
      const canvasCenterY = rectCanvas.height / 2;
      const selectedCenterX = selectedtextLayer.x + boxW / 2;
      const selectedCenterY = selectedtextLayer.y + boxH / 2;
      ctx.save();
      ctx.strokeStyle = "rgba(148,163,184,0.8)";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1;
      if (Math.abs(selectedCenterX - canvasCenterX) <= SNAP_THRESHOLD) {
        ctx.beginPath();
        ctx.moveTo(canvasCenterX, 0);
        ctx.lineTo(canvasCenterX, rectCanvas.height);
        ctx.stroke();
      }
      if (Math.abs(selectedCenterY - canvasCenterY) <= SNAP_THRESHOLD) {
        ctx.beginPath();
        ctx.moveTo(0, canvasCenterY);
        ctx.lineTo(rectCanvas.width, canvasCenterY);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [selectedLayer, textLayers, createCanvasWithImage, img, isDragging]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("itc:imageDataUrl");
      if (saved) {
        const image = new Image();
        image.onload = () => setImg(image);
        image.src = saved;
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    createCanvasWithImage();
    drawText();
  }, [createCanvasWithImage, drawText]);

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

    for (let i = textLayers?.length - 1; i >= 0; i--) {
      const layer = textLayers[i];

      // Determine width used for layout and compute wrapped lines/dimensions
      const width = layer.width || 0;
      let textBoxWidth = width;
      let textBoxHeight = layer.fontSize; // default
      if (ctx) {
        ctx.save();
        ctx.textBaseline = "top";
        ctx.font = `${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}"`;

        // Build lines with manual wrapping like drawText()
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

        const lineHeight = layer.fontSize * LINE_HEIGHT_FACTOR;
        textBoxWidth =
          width || Math.max(...lines.map((l) => ctx!.measureText(l).width), 0) || 200;
        textBoxHeight = Math.max(lineHeight * lines.length, layer.fontSize);
        ctx.restore();
      }
      if (!textBoxWidth) textBoxWidth = 200;
      const height = textBoxHeight;


      const tlx_world = layer.x;
      const tly_world = layer.y;
      const trx_world = tlx_world + textBoxWidth;
      const bry_world = tly_world + height;

      const withinAABB =
        cx >= tlx_world - 4 && cx <= trx_world + 4 && cy >= tly_world - 4 && cy <= bry_world + 4;

      const angle = (layer.rotation * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const alignOffset = 0;

      const toWorld = (lx: number, ly: number) => {
        return {
          x: layer.x + (lx * cos - ly * sin),
          y: layer.y + (lx * sin + ly * cos),
        };
      };

      const rotateLocalX = alignOffset + textBoxWidth / 2;
      const rotateLocalY = -ROTATE_HANDLE_OFFSET;
      const rotateWorld = toWorld(rotateLocalX, rotateLocalY);

      const topRight = toWorld(alignOffset + textBoxWidth, 0);
      const bottomRight = toWorld(alignOffset + textBoxWidth, height);
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

      if (withinAABB) {
        return { layer, zone: "body" };
      }
    }
    return null;
  }, [textLayers, img]);

  const [initialPos, setInitialPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [action, setAction] = useState<"none" | "move" | "resize" | "rotate">("none");
  const [initialWidth, setInitialWidth] = useState<number | null>(null);
  const [initialRotation, setInitialRotation] = useState<number | null>(null);
  const [rotateCenter, setRotateCenter] = useState<{ x: number; y: number } | null>(null);
  const [startAngle, setStartAngle] = useState<number | null>(null);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!img) return
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
        setAction("move");
      } else if (hit.zone === "resize") {
        setDragStart({ x: cx, y: cy });
        setInitialWidth(hit.layer.width || 200);
        setAction("resize");
      } else if (hit.zone === "rotate") {
        // Compute measured box for accurate rotation center
        const canvas = canvasRef.current!;
        const cctx = canvas.getContext("2d");
        let boxW = hit.layer.width || 0;
        let boxH = hit.layer.fontSize;
        if (cctx) {
          cctx.save();
          cctx.textBaseline = "top";
          cctx.font = `${hit.layer.fontWeight} ${hit.layer.fontSize}px "${hit.layer.fontFamily}"`;
          const lines: string[] = [];
          const paragraphs = hit.layer.text.split("\n");
          for (const para of paragraphs) {
            const words = para.split(/(\s+)/);
            let current = "";
            for (const w of words) {
              const test = current + w;
              const metrics = cctx.measureText(test);
              if (boxW && metrics.width > boxW && current.trim() !== "") {
                lines.push(current);
                current = w.trimStart();
              } else {
                current = test;
              }
            }
            lines.push(current);
          }
          const lineHeight = hit.layer.fontSize * LINE_HEIGHT_FACTOR;
          boxW = boxW || Math.max(...lines.map((l) => cctx.measureText(l).width), 0) || 200;
          boxH = Math.max(lineHeight * lines.length, hit.layer.fontSize);
          cctx.restore();
        }
        const centerX = hit.layer.x + boxW / 2;
        const centerY = hit.layer.y + boxH / 2;
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

    const selectedTextLayer = textLayers?.find(
      (layer) => layer.id === selectedLayer
    );
    if (!selectedTextLayer) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (action === "move" && isDragging && dragStart && initialPos) {
      let nx = initialPos.x + (cx - dragStart.x);
      let ny = initialPos.y + (cy - dragStart.y);
      // Measure current box for accurate snapping
      const cctx = canvasRef.current!.getContext("2d");
      let boxW = selectedTextLayer.width || 0;
      let boxH = selectedTextLayer.fontSize;
      if (cctx) {
        cctx.save();
        cctx.textBaseline = "top";
        cctx.font = `${selectedTextLayer.fontWeight} ${selectedTextLayer.fontSize}px "${selectedTextLayer.fontFamily}"`;
        const lines: string[] = [];
        const paragraphs = selectedTextLayer.text.split("\n");
        for (const para of paragraphs) {
          const words = para.split(/(\s+)/);
          let current = "";
          for (const w of words) {
            const test = current + w;
            const metrics = cctx.measureText(test);
            if (boxW && metrics.width > boxW && current.trim() !== "") {
              lines.push(current);
              current = w.trimStart();
            } else {
              current = test;
            }
          }
          lines.push(current);
        }
        const lineHeight = selectedTextLayer.fontSize * LINE_HEIGHT_FACTOR;
        boxW = boxW || Math.max(...lines.map((l) => cctx.measureText(l).width), 0) || 200;
        boxH = Math.max(lineHeight * lines.length, selectedTextLayer.fontSize);
        cctx.restore();
      }

      const rectCanvas = canvasRef.current!.getBoundingClientRect();
      const canvasCenterX = rectCanvas.width / 2;
      const canvasCenterY = rectCanvas.height / 2;
      const layerCenterX = nx + boxW / 2;
      const layerCenterY = ny + boxH / 2;

      if (Math.abs(layerCenterX - canvasCenterX) <= SNAP_THRESHOLD) {
        nx = canvasCenterX - boxW / 2;
      }
      if (Math.abs(layerCenterY - canvasCenterY) <= SNAP_THRESHOLD) {
        ny = canvasCenterY - boxH / 2;
      }

      updateTextLayer(selectedTextLayer.id, { x: nx, y: ny });
    } else if (action === "resize" && dragStart && initialWidth !== null) {

      const dx = cx - dragStart.x;
      const newWidth = Math.max(20, initialWidth + dx);
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

  useEffect(() => {
    drawText();
  }, [textLayers, drawText]);

  useEffect(() => {
    createCanvasWithImage();
  }, [img, createCanvasWithImage]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const meta = isMac ? e.metaKey : e.ctrlKey;
      // Undo/Redo
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      const active = document.activeElement as HTMLElement | null;
      const isTyping = !!active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT" || active.isContentEditable);
      if (isTyping) return;

      if (selectedLayer != null) {
        const step = e.shiftKey ? 10 : 1;
        const layer = textLayers?.find((l) => l.id === selectedLayer);
        if (!layer) return;
        let dx = 0, dy = 0;
        if (e.key === "ArrowLeft") dx = -step;
        else if (e.key === "ArrowRight") dx = step;
        else if (e.key === "ArrowUp") dy = -step;
        else if (e.key === "ArrowDown") dy = step;
        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          updateTextLayer(layer.id, { x: layer.x + dx, y: layer.y + dy });
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, selectedLayer, textLayers, updateTextLayer]);

  useEffect(() => {
    const handle = () => {
      createCanvasWithImage();
      drawText();
    };
    window.addEventListener("resize", handle);
    let ro: ResizeObserver | null = null;
    if (wrapperRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(handle);
      ro.observe(wrapperRef.current);
    }
    return () => {
      window.removeEventListener("resize", handle);
      if (ro && wrapperRef.current) ro.unobserve(wrapperRef.current);
    };
  }, [createCanvasWithImage, drawText]);

  // Export final image at original image dimensions
  const exportPNG = useCallback((): string | null => {
    if (!img || !canvasRef.current) return null;
    const naturalW = Math.max(1, Math.floor(img.naturalWidth));
    const naturalH = Math.max(1, Math.floor(img.naturalHeight));

    const displayRect = canvasRef.current.getBoundingClientRect();
    const scaleFactorX = naturalW / Math.max(1, displayRect.width);
    const scaleFactorY = naturalH / Math.max(1, displayRect.height);
    // We maintain aspect ratio, so both scale factors should be equal
    const s = Math.min(scaleFactorX, scaleFactorY);

    const off = document.createElement("canvas");
    off.width = naturalW;
    off.height = naturalH;
    const octx = off.getContext("2d");
    if (!octx) return null;

    // Draw original image
    octx.clearRect(0, 0, naturalW, naturalH);
    octx.drawImage(img, 0, 0, naturalW, naturalH);

    // Draw text layers at scaled positions
    for (const layer of (textLayers || [])) {
      const fontSize = layer.fontSize * s;
      const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
      const width = layer.width ? layer.width * s : 0;

      octx.save();
      octx.globalAlpha = layer.opacity;
      octx.textBaseline = "top";
      octx.font = `${layer.fontWeight} ${fontSize}px "${layer.fontFamily}"`;
      octx.fillStyle = layer.color;
      octx.textAlign = "left";

      // Build wrapped lines using scaled width
      const lines: string[] = [];
      const paragraphs = layer.text.split("\n");
      for (const para of paragraphs) {
        const words = para.split(/(\s+)/);
        let current = "";
        for (const w of words) {
          const test = current + w;
          const metrics = octx.measureText(test);
          if (width && metrics.width > width && current.trim() !== "") {
            lines.push(current);
            current = w.trimStart();
          } else {
            current = test;
          }
        }
        lines.push(current);
      }

      const textBoxWidth = width || Math.max(...lines.map((l) => octx.measureText(l).width), 0);

      // Apply transform at scaled position
      const x = layer.x * s;
      const y = layer.y * s;
      octx.translate(x, y);
      octx.rotate((layer.rotation * Math.PI) / 180);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineW = octx.measureText(line).width;
        const boxW = width || textBoxWidth;
        let drawX = 0;
        if (layer.align === "center") drawX = (boxW - lineW) / 2;
        else if (layer.align === "right") drawX = boxW - lineW;
        const drawY = i * lineHeight;
        octx.fillText(line, drawX, drawY, width || undefined);
      }

      octx.restore();
    }

    return off.toDataURL("image/png");
  }, [img, textLayers]);

  // Reset editor: clear storage and state
  const resetEditor = useCallback(() => {
    try {
      localStorage.removeItem("itc:imageDataUrl");
      localStorage.removeItem("itc:textLayers");
      localStorage.removeItem("itc:selectedLayer");
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
    }
    // clear file input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
    // mark reset in progress so next draw is forced white
    resetInProgressRef.current = true;
    // clear current image element to prevent any late draws
    try {
      if (img) img.src = "";
    } catch (e) {
      console.error("Failed to clear image element:", e);
    }
    setImg(null);
    // Clear layers and history in context
    resetLayersAndHistory();
    // Immediately hard-clear canvas to avoid any flicker
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) {
      // Reset transform and zero dimensions to force buffer clear
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      c.width = 0;
      c.height = 0;
      // Restore to wrapper size and repaint white
      const wrapper = wrapperRef.current;
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.max(1, Math.floor((wrapper?.clientWidth || 720)));
      const targetH = Math.max(1, Math.floor((wrapper?.clientHeight || 480)));
      c.width = Math.round(targetW * dpr);
      c.height = Math.round(targetH * dpr);
      c.style.width = `${targetW}px`;
      c.style.height = `${targetH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetW, targetH);
    }
    // Redraw blank canvas (no text) after state updates flush
    setTimeout(() => {
      createCanvasWithImage();
    }, 0);
  }, [createCanvasWithImage, resetLayersAndHistory, img]);


  return (
    <main
      id="canvas"
      className="relative flex flex-col flex-1 items-center gap-4 p-4 border border-gray-300 rounded-md w-full h-full min-h-0 overflow-hidden"
    >
      <header className="flex justify-between items-center w-full">
        <h1 className="font-bold text-xl">Canvas</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            label={`Undo`}
            onClick={undo}
            disabled={!canUndo}
            className="text-xs"
          />
          <Button
            variant="ghost"
            size="sm"
            label={`Redo`}
            onClick={redo}
            disabled={!canRedo}
            className="text-xs"
          />
        </div>
      </header>
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

      <section className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          type="file"
          accept="image/png"
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          label="Choose PNG"
          onClick={() => fileInputRef.current?.click()}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!img}
          label="Export PNG"
          onClick={() => {
            const url = exportPNG();
            if (!url) return;
            const a = document.createElement("a");
            a.href = url;
            a.download = "image-text-composer.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
        />
        <Button
          variant="danger"
          size="sm"
          label="Reset"
          onClick={resetEditor}
        />
      </section>
    </main>
  );
};

export default Canvas;
