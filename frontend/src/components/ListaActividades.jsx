import TarjetaActividad from './TarjetaActividad'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-gray-200 p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-full mb-1" />
      <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  )
}

export default function ListaActividades({ actividades, localidad, busqueda, cargando, error, onSeleccionar }) {
  if (cargando) {
    return (
      <section aria-busy="true" aria-label="Cargando actividades">
        <p className="sr-only" role="status">Cargando actividades para {localidad}...</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {Array.from({ length: 6 }).map((_, i) => <li key={i}><SkeletonCard /></li>)}
        </ul>
      </section>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-6 py-8 text-center" role="alert">
        <p className="text-red-700 font-medium">{error}</p>
        <p className="text-red-500 text-sm mt-1">Intenta de nuevo o contacta al administrador.</p>
      </div>
    )
  }

  if (!localidad) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-bogota/10 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <span className="text-bogota text-2xl font-bold">?</span>
        </div>
        <p className="text-gray-700 font-medium">Selecciona una localidad</p>
        <p className="text-gray-600 text-sm mt-1">Elige tu localidad en el selector para ver las actividades disponibles.</p>
      </div>
    )
  }

  // Filtro por búsqueda
  const termino = busqueda.trim().toLowerCase()
  const filtradas = termino
    ? actividades.filter(a =>
        a.titulo.toLowerCase().includes(termino) ||
        a.descripcion?.toLowerCase().includes(termino) ||
        a.lugar.toLowerCase().includes(termino) ||
        a.organizador.toLowerCase().includes(termino)
      )
    : actividades

  if (actividades.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <span className="text-gray-400 text-2xl">—</span>
        </div>
        <p className="text-gray-700 font-medium">Sin actividades en {localidad}</p>
        <p className="text-gray-600 text-sm mt-1">Aún no hay actividades registradas para esta localidad.</p>
      </div>
    )
  }

  if (filtradas.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-700 font-medium">Sin resultados para "{busqueda}"</p>
        <p className="text-gray-600 text-sm mt-1">Intenta con otro término de búsqueda.</p>
      </div>
    )
  }

  return (
    <section aria-label={`Actividades en ${localidad}`}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2" role="list">
        {filtradas.map((act) => (
          <li key={act.id}>
            <TarjetaActividad actividad={act} onClick={() => onSeleccionar(act)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
