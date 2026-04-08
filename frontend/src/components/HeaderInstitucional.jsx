export default function HeaderInstitucional() {
  return (
    <header role="banner">
      {/* Header principal */}
      <div className="bg-bogota text-white px-4 py-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          {/* Escudo texto */}
          <div
            className="shrink-0 w-14 h-14 rounded-full bg-white flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-bogota font-black text-xl leading-none">B</span>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold leading-tight">
              Oferta de Actividades y Talleres
            </h1>
            <p className="text-red-100 text-sm mt-0.5">
              Plataforma de difusión ciudadana — Bogotá y SENA
            </p>
          </div>

        </div>
      </div>
    </header>
  )
}
