function Input(props) {
  return (
    <input
      {...props}
      className="
        w-[400px]
        h-[70px]
        border
        border-black
        p-2
        outline-none
        focus:border-green-400
        focus:ring-2
        focus:ring-green-200
        text-black
        bg-[#D9D9D9]
        text-center
        text-[30px]
        placeholder:text-[30px]

      "
       style={{ fontFamily: '"Jockey One", sans-serif' }}
    />
    
  );
}

export default Input;
