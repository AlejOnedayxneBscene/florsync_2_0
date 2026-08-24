import Input from "./Input";
import Button from "./Button";
import Title from "./Title";
import NameApp from "./NameApp";
import { useState } from "react";

export default function LoginForms({ formData, handleChange, setFormData, handleSubmit, loading }) {


  const [fieldError, setFieldError] = useState({}); // Campos vacíos
  const [error, setError] = useState(""); // Mensaje general

const onSubmit = async (e) => {
  e.preventDefault();

  let newFieldError = {};
  if (!formData.id_usuario) newFieldError.id_usuario = true;
  if (!formData.password) newFieldError.password = true;

  if (Object.keys(newFieldError).length > 0) {
    setFieldError(newFieldError);
    setError("Por favor digite todos los campos");
    return;
  }

  setFieldError({});
  setError("");

  await handleSubmit(e, setError, setFieldError); 

  setFormData({
    ...formData,
    password: ""
  });
};
  return (
   <div className="w-full md:w-1/2 flex flex-col justify-center items-center gap-4 md:gap-8 text-white h-full">
  <Title text="Inicio de sesión" />

  {error && (
    <p className="text-red-500 bg-red-100 px-4 py-2 rounded-lg mb-2 md:mb-4 text-sm md:text-base">{error}</p>
  )}

  <form onSubmit={onSubmit} className="flex flex-col gap-8 md:gap-15 w-full max-w-sm items-center px-4 md:px-0">
    <Input
  type="text"
  name="id_usuario"
  placeholder="Digite su usuario"
  value={formData.id_usuario}
  onChange={handleChange}
  data-lpignore="true"        
  data-form-type="other"
  autoComplete="off"
/>
    <Input
  type="password"
  name="password"
  placeholder="Digite su contraseña"
  value={formData.password}
  onChange={handleChange}
  autoComplete="new-password"
/>

   <Button type="submit" loading={loading}>
      Iniciar sesión
    </Button>

    
      <a
  href="/forgot-password"
  className="text-sm text-white/50 hover:text-white transition-colors"
>
  ¿Olvidaste tu contraseña?
</a>
  </form>
</div>

  );
}
