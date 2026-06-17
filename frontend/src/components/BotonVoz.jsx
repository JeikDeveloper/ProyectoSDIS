import useSpeechDeepgram from '../hooks/useSpeechDeepgram';

const BotonVoz = ({ onResult, onSearch, disabled = false }) => {
  const { estado, error, toggleVoz } = useSpeechDeepgram({
    onResult,
    onSearch,
  });

  const escuchando = estado === 'escuchando';
  const procesando = estado === 'procesando';

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={toggleVoz}
        disabled={procesando || disabled}
        aria-label={
          escuchando
            ? 'Detener grabación'
            : procesando
              ? 'Procesando audio…'
              : 'Buscar por voz'
        }
        title={
          escuchando
            ? 'Escuchando… (para automáticamente al silencio)'
            : procesando
              ? 'Transcribiendo…'
              : 'Buscar por voz con Deepgram'
        }
        className={`
          relative p-2 rounded-full transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bogota focus-visible:ring-offset-1
          ${
            disabled
              ? 'opacity-40 bg-gray-100 text-gray-400 pointer-events-none'
              : escuchando
                ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
                : procesando
                  ? 'bg-yellow-400 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
          }
        `}
      >
        {procesando ? (
          /* Spinner */
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          /* Micrófono */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
          </svg>
        )}
      </button>

      {/* Punto rojo pulsante cuando escucha */}
      {escuchando && (
        <span
          className="absolute -top-0.5 -right-0.5 h-3 w-3
          bg-red-500 rounded-full border-2 border-white animate-ping"
        />
      )}

      {/* Error en tooltip */}
      {error && (
        <div
          role="alert"
          className="
      absolute top-10 right-0 z-20 w-56
      bg-red-50 border border-red-200
      text-red-700 text-xs
      rounded-lg p-2 shadow-lg
      animate-in fade-in duration-200
    "
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default BotonVoz;
