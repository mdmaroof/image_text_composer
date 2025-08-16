import { AppContext } from "@/context/AppContext";
import { useContext } from "react";

type LayerCardType = {
  label: string;
  number: number;
  selected?: boolean;
};

const LayerCard = ({ label, number, selected }: LayerCardType) => {
  const { setTextLayers, setSelectedLayer } = useContext(AppContext)!;

  const deleteLayer = () => {
    setTextLayers((prev) => {
      return prev.filter((z) => z.id !== number);
    });
  };
  return (
    <div
      className={`flex flex-col justify-center ${
        selected ? "border-orange-600" : "border-gray-200"
      } bg-white border-2  px-2 py-2 rounded w-full shrink-0`}
    >
      <h2 className="font-bold text-gray-800 text-lg">Layer {number}</h2>
      <h4 className="text-gray-600">{label}</h4>

      <section className="flex flex-col gap-2 mt-2">
        <div className="flex gap-2">
          <div
            onClick={() => setSelectedLayer(number)}
            className="bg-orange-500 px-2 py-1 rounded text-white"
          >
            Select Layer
          </div>
          <div
            onClick={deleteLayer}
            className="bg-red-600 px-2 py-1 rounded text-white"
          >
            Delete
          </div>
        </div>

        <section className="flex flex-row gap-2">
          <div className="flex-1 bg-blue-400 py-1 rounded text-white text-xs text-center">
            Layer Move Up
          </div>
          <div className="flex-1 bg-blue-400 py-1 rounded text-white text-xs text-center">
            Layer Move Down
          </div>
        </section>
      </section>
    </div>
  );
};

export default LayerCard;
