"use client";
import { useLayersHook } from "@/hooks/layers";
import Button from "../common/Button";
import LayerCard from "./layerCard";

const Layers = () => {
  const { setTextLayers, textLayers } = useLayersHook();
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
        className="flex flex-col flex-1 gap-4 px-4 overflow-y-auto"
      >
        {/* <LayerCard selected number={1} label="heloo world" /> */}
        {textLayers.length === 0 && (
          <h1 className="text-gray-400">No Text Layer Added</h1>
        )}
      </section>

      <Button label="Add Text" onClick={() => {}} />
    </main>
  );
};

export default Layers;
