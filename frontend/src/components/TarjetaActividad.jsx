import { useState } from 'react';
import { sendActividad } from '../services/api';
const TIPO_ESTILOS = {
  Taller: {
    badge: 'bg-dist/10 text-dist border-dist/20',
    borde: 'border-t-dist',
  },
  Evento: {
    badge: 'bg-bogota/10 text-bogota border-bogota/20',
    borde: 'border-t-bogota',
  },
  Actividad: {
    badge: 'bg-sena/10 text-sena border-sena/20',
    borde: 'border-t-sena',
  },
};
const TIPO_DEFAULT = {
  badge: 'bg-gray-100 text-gray-700 border-gray-200',
  borde: 'border-t-gray-400',
};

export default function TarjetaActividad({ actividad, onClick }) {
  const {
    titulo,
    descripcion,
    lugar,
    fecha_inicio,
    fecha_fin,
    hora_inicio,
    hora_fin,
    tipo,
    organizador,
  } = actividad;
  const estilos = TIPO_ESTILOS[tipo] ?? TIPO_DEFAULT;

  const [audioUrl, setAudioUrl] = useState(null);
  const [cargando, setCargando] = useState(false);

  function formatFecha(fecha) {
    if (!fecha) return null;
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  function formatHora(hora) {
    return hora ? hora.slice(0, 5) : null;
  }

  const fechaTexto =
    fecha_fin && fecha_fin !== fecha_inicio
      ? `${formatFecha(fecha_inicio)} al ${formatFecha(fecha_fin)}`
      : formatFecha(fecha_inicio);

  const horaTexto = hora_inicio
    ? hora_fin
      ? `${formatHora(hora_inicio)} – ${formatHora(hora_fin)}`
      : formatHora(hora_inicio)
    : null;

  async function obtenerAudioActividad() {
    setCargando(true);
    try {
      const url = await sendActividad(actividad);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  }

  return (
    <article
      className={`relative bg-white rounded-xl border border-gray-200 border-t-4 ${estilos.borde} shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col h-full group focus-within:ring-2 focus-within:ring-bogota focus-within:ring-offset-2`}
    >
      {/* ── Zona clickeable principal (sin el área de audio) ── */}
      <button
        className="absolute inset-0 z-0 cursor-pointer rounded-xl focus:outline-none"
        onClick={onClick}
        aria-label={`Ver detalle de ${tipo}: ${titulo}`}
      />

      {/* ── Contenido visual ── */}
      <div className="relative z-10 p-5 flex flex-col flex-1 gap-3 pointer-events-none select-none">
        {/* Tipo + organizador */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${estilos.badge}`}
          >
            {tipo}
          </span>
          <span className="text-xs text-gray-600 font-medium">
            {organizador}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-dist transition-colors">
          {titulo}
        </h3>

        {/* Descripción */}
        {descripcion && (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
            {descripcion}
          </p>
        )}

        {/* Datos */}
        <dl className="mt-auto pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
          <div className="flex gap-2 items-start">
            <dt className="font-semibold text-gray-700 shrink-0 w-12">Lugar</dt>
            <dd className="leading-snug line-clamp-1">{lugar}</dd>
          </div>
          <div className="flex gap-2 items-center">
            <dt className="font-semibold text-gray-700 shrink-0 w-12">Fecha</dt>
            <dd>{fechaTexto}</dd>
          </div>
          {horaTexto && (
            <div className="flex gap-2 items-center">
              <dt className="font-semibold text-gray-700 shrink-0 w-12">
                Hora
              </dt>
              <dd>{horaTexto}</dd>
            </div>
          )}
        </dl>

        {/* Hint ver más */}
        {/* <p className="text-xs text-dist font-medium opacity-0 group-hover:opacity-100 transition-opacity text-right">
          Ver detalle →
        </p> */}
      </div>

      {/* ── Zona de audio (z-20 rompe el pointer-events-none del padre) ── */}
      <div className="relative z-20 px-5 pb-5 flex flex-col gap-2 pointer-events-auto">
        <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
          <button
            className="w-full bg-dist hover:bg-dist/80 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bogota focus-visible:ring-offset-1"
            type="button"
            disabled={cargando}
            onClick={obtenerAudioActividad}
            aria-label={`${audioUrl ? 'Regenerar' : 'Generar'} audio de la actividad: ${titulo}`}
          >
            {cargando ? 'Generando audio…' : audioUrl ? '🔊 Regenerar audio' : '🔊 Generar audio'}
          </button>

          {audioUrl && (
            <audio
              controls
              src={audioUrl}
              className="w-full h-10 mt-2"
              aria-label={`Audio de la actividad: ${titulo}`}
            />
          )}

          <p className="text-xs mt-2 text-dist font-medium opacity-0 group-hover:opacity-100 transition-opacity text-right">
            Ver detalle →
          </p>
        </div>
      </div>
    </article>
  );
}
