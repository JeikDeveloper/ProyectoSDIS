import { useState, useEffect } from "react";
import { getLocalidades, getActividades } from "../services/api";
import HeaderInstitucional from "../components/HeaderInstitucional";
import BotonVoz from "../components/BotonVoz";
import ListaActividades from "../components/ListaActividades";
import ModalActividad from "../components/ModalActividad";
import MapaBogota from "../components/MapaBogota";

export default function Inicio() {
  const [localidades, setLocalidades] = useState([]);
  const [localidadSeleccionada, setLocalidadSeleccionada] = useState("");

  useEffect(() => {
    document.title = localidadSeleccionada
      ? `${localidadSeleccionada} — Actividades y Talleres — Bogotá D.C. y SENA`
      : "Oferta de Actividades y Talleres — Bogotá D.C. y SENA";
  }, [localidadSeleccionada]);
  const [actividades, setActividades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [actividadDetalle, setActividadDetalle] = useState(null);

  useEffect(() => {
    getLocalidades()
      .then(setLocalidades)
      .catch(() => setError("No se pudo cargar la lista de localidades."));
  }, []);

  async function seleccionarLocalidad(nombre) {
    if (nombre === localidadSeleccionada) return;
    setLocalidadSeleccionada(nombre);
    setActividades([]);
    setBusqueda("");
    setError(null);
    if (!nombre) return;
    setCargando(true);
    try {
      const data = await getActividades(nombre);
      setActividades(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const termino = busqueda.trim().toLowerCase();
  const actividadesFiltradas = termino
    ? actividades.filter(
        (a) =>
          a.titulo.toLowerCase().includes(termino) ||
          a.descripcion?.toLowerCase().includes(termino) ||
          a.lugar.toLowerCase().includes(termino) ||
          a.organizador.toLowerCase().includes(termino),
      )
    : actividades;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderInstitucional />

      {/* Barra de filtros */}
      <nav
        aria-label="Filtros de búsqueda"
        className="bg-white border-b border-gray-200 shadow-sm px-4 py-4"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="sm:w-60">
            <label
              htmlFor="selector-localidad"
              className="block text-xs font-semibold text-dist uppercase tracking-wide mb-1.5"
            >
              Localidad
            </label>
            <select
              id="selector-localidad"
              value={localidadSeleccionada}
              onChange={(e) => seleccionarLocalidad(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-500 bg-white px-3 py-2.5 text-gray-900 font-medium focus:border-bogota focus:outline-none focus:ring-2 focus:ring-bogota/20 transition-colors"
              aria-label="Filtrar actividades por localidad"
            >
              <option value="">— Elige una localidad —</option>
              {localidades.map((loc) => (
                <option key={loc.id} value={loc.nombre}>
                  {loc.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 max-w-sm">
            <label
              htmlFor="buscador"
              className="block text-xs font-semibold text-dist uppercase tracking-wide mb-1.5"
            >
              Buscar
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                id="buscador"
                type="search"
                placeholder="Título, lugar, organizador..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                disabled={!localidadSeleccionada || cargando}
                className="w-full rounded-lg border-2 border-gray-500 bg-white pl-9 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-bogota focus:outline-none focus:ring-2 focus:ring-bogota/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Buscar por palabra clave"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <BotonVoz
                  onResult={(texto) => setBusqueda(texto)}
                  onSearch={(texto) => setBusqueda(texto)}
                  disabled={!localidadSeleccionada || cargando}
                />
              </div>
            </div>
          </div>
          {localidadSeleccionada && !cargando && (
            <p
              className="text-sm text-gray-500 pb-2.5 shrink-0"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="font-bold text-dist">
                {actividadesFiltradas.length}
              </span>{" "}
              resultado{actividadesFiltradas.length !== 1 ? "s" : ""}
              {busqueda && (
                <span className="text-gray-600"> · "{busqueda}"</span>
              )}
            </p>
          )}
        </div>
      </nav>

      {/* Cuerpo: mapa + lista */}
      <main
        id="main-content"
        className="flex-1 max-w-7xl mx-auto w-full px-4 py-6"
      >
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Mapa */}
          <div className="lg:w-[420px] shrink-0">
            <div className="sticky top-4">
              <h2 className="text-xs font-semibold text-dist uppercase tracking-wide mb-2">
                Mapa de localidades
              </h2>
              <MapaBogota
                localidadSeleccionada={localidadSeleccionada}
                onLocalidadClick={seleccionarLocalidad}
              />
              {localidadSeleccionada && (
                <p className="text-xs text-center text-gray-600 mt-2">
                  Mostrando:{" "}
                  <span className="font-semibold text-dist">
                    {localidadSeleccionada}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Lista de actividades */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-semibold text-dist uppercase tracking-wide mb-2">
              {localidadSeleccionada
                ? `Actividades — ${localidadSeleccionada}`
                : "Actividades"}
            </h2>
            <ListaActividades
              actividades={actividades}
              localidad={localidadSeleccionada}
              busqueda={busqueda}
              cargando={cargando}
              error={error}
              onSeleccionar={setActividadDetalle}
            />
          </div>
        </div>
      </main>

      {actividadDetalle && (
        <ModalActividad
          actividad={actividadDetalle}
          onCerrar={() => setActividadDetalle(null)}
        />
      )}

      <footer className="bg-dist text-white text-xs text-center py-4 px-4 mt-auto">
        <p>
          Alcaldía Mayor de Bogotá D.C. · SENA —{" "}
          <span className="opacity-75">
            Plataforma informativa de actividades por localidad
          </span>
        </p>
      </footer>
    </div>
  );
}
