"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const Canvas = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    if (!img || !wrapperRef.current || !canvasRef.current) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const createCanvas = () => {
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
    };

    createCanvas();
  }, [img]);

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
