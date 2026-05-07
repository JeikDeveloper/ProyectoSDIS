export default function HeaderInstitucional() {
  return (
    <header role="banner">
      {/* Skip link: visible solo al recibir foco por teclado (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-dist focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-sm focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

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
