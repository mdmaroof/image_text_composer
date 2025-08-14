"use client";
import { AppContext } from "@/context/AppContext";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

type Align = "left" | "center" | "right";
type TextLayer = {
  id: string;
  text: string;
  x: number; // canvas CSS pixels
  y: number; // canvas CSS pixels
  fontFamily: string;
  fontSize: number; // px
  fontWeight: number; // 300..900
  color: string;
  opacity: number; // 0..1
  align: Align;
  rotation: number; // degrees
  z: number;
};

const DEFAULT_LAYER = (): TextLayer => ({
  id: crypto.randomUUID(),
  text: "Double-click to edit",
  x: 100,
  y: 80,
  fontFamily:
    "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  fontSize: 28,
  fontWeight: 700,
  color: "#111827",
  opacity: 1,
  align: "left",
  rotation: 0,
  z: Date.now(),
});

const Canvas = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { textLayers, selected } = useContext(AppContext)!;

  const [img, setImg] = useState<HTMLImageElement | null>(null);

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

  const createCanvas = useCallback(() => {
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

  useEffect(() => {
    createCanvas();
  }, [img, createCanvas]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // clear
    // const w = canvas.clientWidth;
    // const h = canvas.clientHeight;
    // ctx.clearRect(0, 0, w, h);

    createCanvas();

    // draw in z order
    const ordered = [...textLayers].sort((a, b) => a.id - b.id);
    for (const layer of ordered) {
      ctx.save();
      // ctx.globalAlpha = layer.opacity;
      ctx.textBaseline = "top";
      // ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
      // ctx.fillStyle = layer.color;

      ctx.fillStyle = "#FFF";

      // alignment offset
      const metrics = ctx.measureText(layer.text);
      const textW = metrics.width;
      // const textH = layer.fontSize; // decent approximation
      const textH = 12;

      let offsetX = 10;
      // if (layer.align === "center") offsetX = -textW / 2;
      // else if (layer.align === "right") offsetX = -textW;

      // rotation about the anchor point
      // ctx.translate(layer.x, layer.y);
      // ctx.rotate((layer.rotation * Math.PI) / 180);

      ctx.fillText(layer.text, offsetX, 0);

      // selection box
      if (selected && selected === layer.id) {
        ctx.strokeStyle = "rgba(59,130,246,0.9)"; // blue
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(offsetX - 4, -4, textW + 8, textH + 8);
      }
      ctx.restore();
    }
  }, [selected, textLayers, createCanvas]);

  useEffect(() => {
    draw();
  }, [textLayers, draw]);

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
