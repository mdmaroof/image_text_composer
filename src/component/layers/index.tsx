const Layers = () => {
  return (
    <main
      id="layers"
      className="relative flex flex-col gap-2 py-4 border border-gray-300 rounded-md w-80 h-full min-h-0"
    >
      <div className="px-4 pb-2">
        <h1 className="pb-2 font-bold text-xl">Layers</h1>
        <hr className="border-gray-300" />
      </div>
      <section
        id="listing"
        className="flex flex-col gap-4 px-4 overflow-y-auto"
      >
        <div className="bg-white border border-gray-300 rounded w-full h-20 shrink-0" />
        <div className="bg-white border border-gray-300 rounded w-full h-20 shrink-0" />
        <div className="bg-white border border-gray-300 rounded w-full h-20 shrink-0" />
        <div className="bg-white border border-gray-300 rounded w-full h-20 shrink-0" />
        <div className="bg-white border border-gray-300 rounded w-full h-20 shrink-0" />
        <div className="bg-white border border-gray-300 rounded w-full h-20 shrink-0" />
      </section>
    </main>
  );
};

export default Layers;
