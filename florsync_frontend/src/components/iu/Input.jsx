import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Input({ type, name, ...props }) {
  const [showPassword, setShowPassword] = useState(false);

  // Determinar si es campo de contraseña
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  // Función para permitir solo números si es id_usuario


  return (
    <div className="relative w-[400px]">
      <input
        {...props}
        name={name}
        type={inputType}
        className="
          w-full
          h-[70px]
          border
          border-black
          rounded-md
          p-2
          pr-12
          outline-none
          transition
          focus:border-[#00DF82]
          focus:ring-2
          focus:ring-[#00DF82]/40
          text-black
          bg-[#E5E5E5]
          text-center
          text-[30px]
          placeholder:text-[30px]
          placeholder:text-gray-500
        "
        style={{ fontFamily: '"Jockey One", sans-serif' }}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
        >
          {showPassword ? <AiOutlineEyeInvisible size={25} /> : <AiOutlineEye size={25} />}
        </button>
      )}
    </div>
  );
}
