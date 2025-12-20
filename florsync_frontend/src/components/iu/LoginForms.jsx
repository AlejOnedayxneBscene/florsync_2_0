import Input from "./Input";
import Button from "./Button";
import Title from "./Title";
import NameApp from "./NameApp";

export default function LoginForms({ formData, handleChange, handleSubmit, loading }) {
  return (
    <div className="w-full md:w-1/2 
    flex flex-col 
    justify-center 
    items-center 
    gap-15
    text-white 
    h-full"
    >

    <Title text="Inicio de sesión " />

      <form 
        onSubmit={handleSubmit} 
        className="flex flex-col gap-20 w-full max-w-sm items-center"
      >
        {/* w-full y max-w-sm para limitar ancho del formulario */}
        <Input
          type="text"
          name="id_usuario"
          placeholder="Digite su usuario"
          value={formData.id_usuario}
          onChange={handleChange}
        />

        <Input
          type="password"
          name="password"
          placeholder="Digite su contraseña"
          value={formData.password}
          onChange={handleChange}
        />

        <Button type="submit" loading={loading}>
          Iniciar sesión
        </Button>
      </form>
    </div>
  );
}
