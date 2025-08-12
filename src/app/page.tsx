export default function Home() {
  return (
    <div className="relative flex flex-col gap-4 px-4 py-4 w-full h-dvh">
      <div className="flex flex-1 gap-4">
        <section id="canvas" className="flex-1 border rounded-md w-full h-full">
          Canvas
        </section>
        <section id="layers" className="border rounded-md w-80 h-full">
          Layers
        </section>
      </div>
      <section id="selector" className="border rounded-md h-72"></section>
    </div>
  );
}
