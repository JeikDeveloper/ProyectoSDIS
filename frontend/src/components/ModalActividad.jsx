import { useEffect, useRef } from 'react'

const TIPO_ESTILOS = {
  Taller:    'bg-dist/10 text-dist border-dist/20',
  Evento:    'bg-bogota/10 text-bogota border-bogota/20',
  Actividad: 'bg-sena/10 text-sena border-sena/20',
}

const SELECTOR_FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function ModalActividad({ actividad, onCerrar }) {
  const panelRef       = useRef(null)
  const focoAnterior   = useRef(null)

  // Guardar foco anterior, enfocar primer elemento del modal al abrir
  useEffect(() => {
    focoAnterior.current = document.activeElement
    const primero = panelRef.current?.querySelectorAll(SELECTOR_FOCUSABLE)?.[0]
    primero?.focus()
    return () => { focoAnterior.current?.focus() }
  }, [])

  // Trampa de foco + cierre con Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') { onCerrar(); return }
      if (e.key !== 'Tab') return

      const focusables = Array.from(
        panelRef.current?.querySelectorAll(SELECTOR_FOCUSABLE) ?? []
      )
      if (!focusables.length) return

      const primero = focusables[0]
      const ultimo  = focusables[focusables.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === primero) { e.preventDefault(); ultimo.focus() }
      } else {
        if (document.activeElement === ultimo)  { e.preventDefault(); primero.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCerrar])

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const {
    titulo, descripcion, lugar, fecha_inicio, fecha_fin,
    hora_inicio, hora_fin, tipo, organizador, localidad,
  } = actividad

  function formatFecha(f) {
    if (!f) return null
    const [y, m, d] = f.split('-')
    return `${d}/${m}/${y}`
  }
  function formatHora(h) { return h ? h.slice(0, 5) : null }

  const badgeClass = TIPO_ESTILOS[tipo] ?? 'bg-gray-100 text-gray-700 border-gray-200'

  const fechaTexto = fecha_fin && fecha_fin !== fecha_inicio
    ? `${formatFecha(fecha_inicio)} al ${formatFecha(fecha_fin)}`
    : formatFecha(fecha_inicio)

  const horaTexto = hora_inicio
    ? hora_fin ? `${formatHora(hora_inicio)} – ${formatHora(hora_fin)}` : formatHora(hora_inicio)
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCerrar}
        aria-hidden="true"
      />

      {/* Panel */}
      <div ref={panelRef} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Franja superior por tipo */}
        <div className={`h-1.5 w-full ${tipo === 'Taller' ? 'bg-dist' : tipo === 'Evento' ? 'bg-bogota' : 'bg-sena'}`} aria-hidden="true" />

        {/* Header del modal */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeClass}`}>
                {tipo}
              </span>
              <span className="text-xs text-gray-600 font-medium">{organizador}</span>
            </div>
            <button
              onClick={onCerrar}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-label="Cerrar detalle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h2 id="modal-titulo" className="text-xl font-bold text-gray-900 mt-3 leading-snug">
            {titulo}
          </h2>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

          {descripcion && (
            <p className="text-sm text-gray-600 leading-relaxed">{descripcion}</p>
          )}

          <dl className="space-y-3">
            {[
              { label: 'Localidad', valor: localidad },
              { label: 'Lugar',     valor: lugar },
              { label: 'Fecha',     valor: fechaTexto },
              ...(horaTexto ? [{ label: 'Horario', valor: horaTexto }] : []),
            ].map(({ label, valor }) => (
              <div key={label} className="flex gap-3 text-sm">
                <dt className="w-20 shrink-0 font-semibold text-gray-600 pt-0.5">{label}</dt>
                <dd className="text-gray-800 leading-snug">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Footer del modal */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onCerrar}
            className="bg-dist hover:bg-dist-light text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
