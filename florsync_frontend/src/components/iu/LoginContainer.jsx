import NameApp from "./NameApp";

export default function LoginContainer({ children }) {
  return (
   <div
  className="
    min-h-screen
    flex
    items-center
    justify-center
    bg-gradient-to-br
    from-[#03624C]
    via-[#048C6A]
    to-[#014A3A]
    w-screen
  "
>

      {/* Card principal */}
     <div
  className="
    relative
    flex flex-col md:flex-row
    bg-gradient-to-br
    from-[#032221]
    via-[#044A45]
    to-[#021716]
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
