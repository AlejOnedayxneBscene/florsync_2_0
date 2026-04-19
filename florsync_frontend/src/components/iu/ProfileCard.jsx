export default function ProfileCard({ nombre }) {
  return (
    <div className="relative bg-gradient-to-br from-[#0f3d2e] to-[#0a2e22] rounded-2xl p-6 flex flex-col items-center justify-center gap-4 min-h-[200px] shadow-lg border border-white/10 overflow-hidden">
      
      {/* efecto decorativo */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#4ecfa0]/10 rounded-full blur-2xl"></div>

      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-[#1a5c48] border-2 border-[#4ecfa0]/40 flex items-center justify-center shadow-md">
        <svg className="w-11 h-11 opacity-70" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" fill="white" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="white" />
        </svg>
      </div>

      {/* Nombre */}
      <div className="text-center">
        <p className="text-white font-semibold text-base leading-tight">
          {nombre}
        </p>
        <p className="text-white/40 text-xs mt-1">Vendedor</p>
      </div>

      {/* Estado */}
      <div className="flex items-center gap-2 bg-[#4ecfa0]/10 px-3 py-1 rounded-full border border-[#4ecfa0]/20">
        <span className="w-2 h-2 bg-[#4ecfa0] rounded-full animate-pulse"></span>
        <span className="text-[#4ecfa0] text-xs font-medium">
          Activo
        </span>
      </div>
    </div>
  );
}