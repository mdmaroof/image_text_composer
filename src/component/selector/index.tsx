"use client";
import { AppContext, TextLayerType } from "@/context/AppContext";
import { GOOGLE_FONTS } from "@/helpers/GoogleFonts";
import { useContext } from "react";

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
    <section id="selector" className="relative bg-white shadow-sm border border-gray-200 rounded-lg h-72">
      {textLayers.length === 0 || !selectedTextLayer ? (
        <main className="flex flex-col justify-center items-center p-6 h-full text-center">
          <div className="text-gray-500 text-sm">No text layer selected</div>
          <div className="text-gray-400 text-xs">Add or select a text layer to start editing</div>
        </main>
      ) : (
        <section className="flex flex-col h-full">
          {/* Header */}
          <header className="flex justify-between items-center px-3 py-2 border-gray-200 border-b">
            <h2 className="font-semibold text-gray-800 text-sm">Text Layer #{selectedTextLayer.id ?? selectedLayer}</h2>
            <button
              onClick={deleteLayer}
              className="hover:bg-red-50 px-2 py-1 border border-red-300 rounded text-red-600 text-xs transition"
              title="Delete selected layer"
            >
              Delete
            </button>
          </header>

          {/* Body */}
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2 p-3 overflow-auto">
            {/* Text Content */}
            <div>
              <label className="block mb-1 font-medium text-gray-700 text-xs">Text</label>
              <textarea
                rows={4}
                value={selectedTextLayer.text}
                onChange={(e) => updateTextLayer(selectedLayer!, { text: e.target.value })}
                className="p-2 border border-gray-300 focus:border-blue-500 rounded-md focus:ring-1 focus:ring-blue-500 w-full text-sm transition"
                placeholder="Type your text here..."
              />
            </div>

            {/* Styling Controls */}
            <div className="content-start gap-3 grid grid-cols-2 md:grid-cols-3">
              {/* Font Family */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 text-xs">Font</label>
                <select
                  value={selectedTextLayer.fontFamily}
                  onChange={(e) => updateTextLayer(selectedLayer!, { fontFamily: e.target.value })}
                  className="p-2 border border-gray-300 focus:border-blue-500 rounded-md focus:ring-1 focus:ring-blue-500 w-full text-xs transition"
                >
                  {GOOGLE_FONTS.map((font) => (
                    <option key={font.name} value={font.name}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 text-xs">Size</label>
                <input
                  type="number"
                  min="8"
                  max="200"
                  value={selectedTextLayer.fontSize || 28}
                  onChange={(e) => updateTextLayer(selectedLayer!, { fontSize: Number(e.target.value) })}
                  className="p-2 border border-gray-300 focus:border-blue-500 rounded-md focus:ring-1 focus:ring-blue-500 w-full text-xs transition"
                />
              </div>

              {/* Font Weight */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 text-xs">Weight</label>
                <select
                  value={selectedTextLayer.fontWeight || 400}
                  onChange={(e) => updateTextLayer(selectedLayer!, { fontWeight: Number(e.target.value) })}
                  className="p-2 border border-gray-300 focus:border-blue-500 rounded-md focus:ring-1 focus:ring-blue-500 w-full text-xs transition"
                >
                  <option value={300}>Light</option>
                  <option value={400}>Regular</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semi</option>
                  <option value={700}>Bold</option>
                </select>
              </div>

              {/* Alignment */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 text-xs">Align</label>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => updateTextLayer(selectedLayer!, { align })}
                      className={`flex-1 w-[50px] py-1.5 px-1 border rounded-md text-xs font-medium transition ${selectedTextLayer.align === align
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}
                      `}
                      title={`Align ${align}`}
                      aria-label={`Align ${align}`}
                    >
                      {align === "left" && "L"}
                      {align === "center" && "C"}
                      {align === "right" && "R"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 text-xs">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedTextLayer.color || '#111827'}
                    onChange={(e) => updateTextLayer(selectedLayer!, { color: e.target.value })}
                    className="border border-gray-300 rounded w-8 h-8 hover:scale-105 transition-transform cursor-pointer"
                    title="Pick color"
                  />
                  <input
                    type="text"
                    value={selectedTextLayer.color || ''}
                    onChange={(e) => updateTextLayer(selectedLayer!, { color: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 focus:border-blue-500 rounded-md focus:ring-1 focus:ring-blue-500 text-xs"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Opacity */}
              <div className="col-span-2 md:col-span-1">
                <label className="block mb-1 font-medium text-gray-700 text-xs">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedTextLayer.opacity}
                  onChange={(e) => updateTextLayer(selectedLayer!, { opacity: Number(e.target.value) })}
                  className="bg-gray-200 rounded w-full h-2 appearance-none cursor-pointer"
                />
                <div className="mt-1 text-gray-500 text-xs text-right">
                  {Math.round((selectedTextLayer.opacity ?? 1) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  );
};

export default SelectorBox;
