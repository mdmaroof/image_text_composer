"use client";
import { AppContext } from "@/context/AppContext";
import { useContext } from "react";

const SelectorBox = () => {
  const { textLayers } = useContext(AppContext)!;
  return (
    <section id="selector" className="relative border rounded-md h-72">
      {/* SelectorBox - {textLayers.length} */}
      {textLayers.length === 0 && (
        <main className="flex justify-center items-center h-full">
          <div className="text-gray-500">Select Text Layer first</div>
        </main>
      )}
    </section>
  );
};

export default SelectorBox;
