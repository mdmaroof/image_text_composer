type LayerCardType = {
  label: string;
  number: number;
  selected?: boolean;
};

const LayerCard = ({ label, number, selected }: LayerCardType) => {
  return (
    <div
      className={`flex flex-col justify-center ${
        selected ? "border-orange-600" : "border-gray-300"
      } bg-white px-2 py-2 border  rounded w-full h-20 shrink-0`}
    >
      <h2 className="font-bold text-gray-800 text-lg">Layer {number}</h2>
      <h4 className="text-gray-600">{label}</h4>
    </div>
  );
};

export default LayerCard;
