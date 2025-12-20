import NameApp from "./NameApp";

export default function LoginContainer({ children }) {
  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-[#03624C]
        w-screen
      "
    >
      {/* Card principal */}
      <div
        className="
          relative             /* <- importante para que los elementos absolutos se posicionen respecto a esta card */
          flex flex-col md:flex-row
          bg-[#032221]
          rounded-xl
          p-4
          gap-3
          shadow-xl
          w-[95vw] min-w-[320px] max-w-[1600px]
          h-[90vh]
        "
      >
        {/* Nombre de la app arriba a la derecha de la card */}
        <div className="absolute top-4 right-6">
          <NameApp text="FlorSync 2.0" />
        </div>

        {/* Aquí van los hijos de LoginContainer */}
        {children}
      </div>
    </div>
  );
}
