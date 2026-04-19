export default function Filters({ view, setView }) {
  const options = [
    { value: "day", label: "Día" },
    { value: "week", label: "Semana" },
    { value: "month", label: "Mes" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setView(opt.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === opt.value
              ? "bg-teal-900 text-white"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}