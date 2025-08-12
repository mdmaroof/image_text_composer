const Canvas = () => {
  return (
    <main
      id="canvas"
      className="relative flex flex-col flex-1 items-center gap-4 p-4 border border-gray-300 rounded-md w-full h-full min-h-0 overflow-hidden"
    >
      <h1 className="font-bold text-xl">Canvas</h1>
      <section className="flex-1 mx-auto min-h-0">
        <canvas className="bg-white shadow-md border border-gray-100 rounded w-[400px] h-full"></canvas>
      </section>
    </main>
  );
};

export default Canvas;
