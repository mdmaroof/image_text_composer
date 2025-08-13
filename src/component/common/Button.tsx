type ButtonType = {
  label: string;
  onClick: () => void;
};

const Button = ({ label, onClick }: ButtonType) => {
  return (
    <button
      onClick={() => onClick()}
      className="bg-gray-100 hover:bg-gray-200 mx-4 py-3 border border-gray-300 rounded-md font-bold transition-all cursor-pointer"
    >
      {label}
    </button>
  );
};

export default Button;
