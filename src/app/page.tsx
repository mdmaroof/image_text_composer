export default function Home() {
  return (
    <div className="relative flex flex-col gap-4 px-4 py-4 w-full h-dvh">
      <main className="flex flex-1 gap-4">
        <div className="flex-1 border rounded-md w-full h-full">Canvas</div>
        <section id="layers" className="border rounded-md w-80 h-full">
          Layers
        </section>
      </main>

      <section id="text_tools" className="border rounded-md h-72"></section>
    </div>
  );
}
