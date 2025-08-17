import { AppContext } from "@/context/AppContext";
import { useContext } from "react";

type LayerCardType = {
  label: string;
  number: number;
  selected?: boolean;
};

const LayerCard = ({ label, number, selected }: LayerCardType) => {
  const { setTextLayers, setSelectedLayer, textLayers } = useContext(AppContext)!;
  
  const moveUp = () => {
    setTextLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === number);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = () => {
    setTextLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === number);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const myIndex = textLayers?.findIndex((l) => l.id === number);
  const canMoveUp = myIndex > 0;
  const canMoveDown = myIndex !== -1 && myIndex < textLayers?.length - 1;
  return (
    <div
      className={`flex flex-col justify-center ${
        selected ? "border-orange-600" : "border-gray-200"
      } bg-white border-2  px-2 py-2 rounded w-full shrink-0`}
    >
      <h2 className="font-bold text-gray-800 text-lg">Layer {number}</h2>
      <h4 className="overflow-hidden text-gray-600 truncate text-ellipsis whitespace-nowrap">{label}</h4>

      <section className="flex flex-col gap-2 mt-2">
        <div className="flex gap-2">
          <div
            onClick={() => setSelectedLayer(number)}
            className="bg-orange-500 hover:bg-orange-600 px-2 py-1 rounded text-white transition cursor-pointer"
          >
            Select Layer
          </div>
          {/* <div
            onClick={deleteLayer}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white transition cursor-pointer"
          >
            Delete
          </div> */}
        </div>

        <section className="flex flex-row gap-2">
          <button
            onClick={moveUp}
            disabled={!canMoveUp}
            className={`flex-1 py-1 rounded cursor-pointer text-white text-xs text-center ${canMoveUp ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 cursor-not-allowed"}`}
            title="Move layer up"
          >
            Move Up
          </button>
          <button
            onClick={moveDown}
            disabled={!canMoveDown}
            className={`flex-1 py-1 rounded cursor-pointer text-white text-xs text-center ${canMoveDown ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 cursor-not-allowed"}`}
            title="Move layer down"
          >
            Move Down
          </button>
        </section>
      </section>
    </div>
  );
};

export default LayerCard;
