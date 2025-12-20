const Button = ({ children, type = "button", loading = false }) => {
  return (
    <button
      type={type}
      disabled={loading}
      className={`
        w-[400px]
        h-[70px]
        text-[30px]
        py-2
        font-semibold
        transition
        rounded-none
        ${loading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-[#00DF82] hover:bg-green-500 active:scale-95 text-black"}
      `}
       style={{ fontFamily: '"Jockey One", sans-serif' }}
    >
      {loading ? "Cargando..." : children}
    </button>
  );
};

export default Button;
