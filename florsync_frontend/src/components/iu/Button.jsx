const Button = ({ children, type = "button", loading = false, onClick }) => {
  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick} 
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
          : `
            bg-gradient-to-r
            from-[#00DF82]
            to-[#00B96B]
            hover:from-[#00F090]
            hover:to-[#00C774]
            active:scale-95
            text-black
          `}
      `}
      style={{ fontFamily: '"Jockey One", sans-serif' }}
    >
      {loading ? "Cargando..." : children}
    </button>
  );
};

export default Button;
