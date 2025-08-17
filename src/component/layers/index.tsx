"use client";
import { AppContext } from "@/context/AppContext";
import Button from "../common/Button";
import LayerCard from "./layerCard";
import { useContext } from "react";
import { TextLayerType, Align } from "@/context/AppContext";

const Layers = () => {
  const { setTextLayers, textLayers, selectedLayer, setSelectedLayer } =
    useContext(AppContext)!;

  const addTextLayer = () => {

    if (!localStorage.getItem("itc:imageDataUrl")) {
      alert("Please upload an image first");
      return;
    }
    setTextLayers((prev: TextLayerType[] = []) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const newId = safePrev.length > 0 ? Math.max(...safePrev.map(l => l.id)) + 1 : 1;
      const newLayer = {
        text: "Custom Text",
        id: newId,
        x: 100,
        y: 80,
        fontFamily: "Inter",
        fontSize: 28,
        fontWeight: 700,
        color: "#111827",
        opacity: 1,
        align: "left" as Align,
        rotation: 0,
        width: 300,
        height: 80,
        z: Date.now(),
      };
      setSelectedLayer(newId);
      return [newLayer, ...safePrev];
    });
  };

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
        {textLayers?.length === 0 && (
          <h1 className="text-gray-400">No Text Layer Added</h1>
        )}

        {textLayers?.length > 0 &&
          textLayers?.map((card) => {
            return (
              <LayerCard
                selected={selectedLayer === card.id}
                key={card.id}
                label={card.text}
                number={card.id}
              />
            );
          })}
      </section>


      <Button className="mx-4"
        label="Add Text" onClick={addTextLayer} />
    </main>
  );
};

export default Layers;
