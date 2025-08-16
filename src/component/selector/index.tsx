"use client";
import { AppContext, TextLayerType } from "@/context/AppContext";
import { useContext } from "react";
import Button from "../common/Button";

const SelectorBox = () => {
  const { textLayers, selectedLayer, setTextLayers } = useContext(AppContext)!;
  const selectedTextLayer = textLayers.find((layer) => layer.id === selectedLayer);
  const updateTextLayer = (id: number, updates: Partial<TextLayerType>) => {
    setTextLayers((prev: TextLayerType[]) => {
      return prev.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      );
    });
  };

  const deleteLayer = () => {
    setTextLayers((prev) => {
      return prev.filter((z) => z.id !== selectedLayer!);
    });
  };

  return (
    <section id="selector" className="relative border rounded-md h-72">
      {/* SelectorBox - {textLayers.length} */}
      {textLayers.length === 0 ? (
        <main className="flex justify-center items-center h-full">
          <div className="text-gray-500">Select Text Layer first</div>
        </main>
      ) : (

        <section className="flex gap-4 p-2">
          <div className="flex-2">
            <h2 className="font-bold text-gray-800 text-lg">Text Content</h2>
            <textarea rows={5} value={selectedTextLayer?.text} onChange={(e) => updateTextLayer(selectedLayer!, { text: e.target.value })} className="border w-full" />
          </div>

          <div className="flex-3">
            <h2 className="font-bold text-gray-800 text-lg">styling</h2>

            <div className="flex flex-row gap-4">
              {/* Font Size */}
              <div className="w-[150px]">
                <label className="block mb-1 font-medium text-gray-600 text-xs">
                  Size
                </label>
                <input
                  type="number"
                  min="8"
                  max="200"
                  value={selectedTextLayer?.fontSize}
                  onChange={(e) => updateTextLayer(selectedLayer!, { fontSize: Number(e.target.value) })}
                  className="p-2 border border-gray-300 focus:border-blue-500 rounded focus:ring-1 focus:ring-blue-500 w-full text-xs transition-all"
                />
              </div>


              {/* Font Weight */}
              <div className="w-[150px]">
                <label className="block mb-1 font-medium text-gray-600 text-xs">
                  Weight
                </label>
                <select
                  value={selectedTextLayer?.fontWeight}
                  onChange={(e) => updateTextLayer(selectedLayer!, { fontWeight: Number(e.target.value) })}
                  className="p-2 border border-gray-300 focus:border-blue-500 rounded focus:ring-1 focus:ring-blue-500 w-full text-xs transition-all"
                >
                  <option value={300}>Light</option>
                  <option value={400}>Regular</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semi</option>
                  <option value={700}>Bold</option>
                  <option value={800}>Extra</option>
                  <option value={900}>Black</option>
                </select>
              </div>

              {/* Alignment */}
              <div>
                <label className="block mb-1 font-medium text-gray-600 text-xs">
                  Align
                </label>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => updateTextLayer(selectedLayer!, { align })}
                      className={`flex-1 w-[50px] py-2 px-1 border rounded text-xs font-medium transition-all ${selectedTextLayer?.align === align
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {align === "left" && "L"}
                      {align === "center" && "C"}
                      {align === "right" && "R"}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>


          {/* <div className="flex flex-1 justify-center items-center">
            <Button label="Delete" onClick={() => deleteLayer()} />
          </div> */}


        </section>

      )}
    </section>
  );
};

export default SelectorBox;
