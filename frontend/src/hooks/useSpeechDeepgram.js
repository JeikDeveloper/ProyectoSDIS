import { useState, useRef, useCallback, useEffect } from 'react';

const SILENCE_THRESHOLD = 0.01; // Nivel mínimo de sonido (0-1)
const SILENCE_DURATION = 2000; // ms de silencio para cortar

const useSpeechDeepgram = ({ onResult, onSearch, disabled = false }) => {
  const [estado, setEstado] = useState('idle'); // 'idle' | 'escuchando' | 'procesando'
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!error) return;

    // CC19/WCAG 2.2.1: tiempo suficiente para leer el aviso (incl. lectores de pantalla)
    const timer = setTimeout(() => {
      setError(null);
    }, 10000);

    return () => clearTimeout(timer);
  }, [error]);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // ─── Detecta silencio con Web Audio API ──────────────────────────────────
  const iniciarDetectorSilencio = useCallback((stream) => {
    audioCtxRef.current = new AudioContext();
    analyserRef.current = audioCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 512;

    const source = audioCtxRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);

    const dataArray = new Uint8Array(analyserRef.current.fftSize);

    const comprobarSilencio = () => {
      analyserRef.current.getByteTimeDomainData(dataArray);

      // RMS = nivel de volumen promedio
      const rms = Math.sqrt(
        dataArray.reduce((acc, v) => acc + Math.pow((v - 128) / 128, 2), 0) /
          dataArray.length,
      );

      if (rms < SILENCE_THRESHOLD) {
        // Hay silencio: iniciar/mantener el timer
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            detenerGrabacion();
          }, SILENCE_DURATION);
        }
      } else {
        // Hay voz: cancelar el timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }

      animFrameRef.current = requestAnimationFrame(comprobarSilencio);
    };

    comprobarSilencio();
  }, []);

  // ─── Enviar audio a Deepgram vía backend ─────────────────────────────────
  const transcribir = useCallback(
    async (blob) => {
      setEstado('procesando');
      try {
        const formData = new FormData();
        formData.append('audio', blob, 'grabacion.webm');

        const res = await fetch('/api/transcribir', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);

        const { transcript } = await res.json();

        if (transcript?.trim()) {
          onResult(transcript); // Escribe el texto en el input
          onSearch(transcript); // Lanza la búsqueda
        } else {
          setError('No se detectó texto. Intenta de nuevo.');
        }
      } catch (err) {
        setError('Error al transcribir. Revisa tu conexión.');
        console.error(err);
      } finally {
        setEstado('idle');
      }
    },
    [onResult, onSearch],
  );

  // ─── Detener grabación ────────────────────────────────────────────────────
  const detenerGrabacion = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    audioCtxRef.current?.close();

    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop(); // dispara ondataavailable + onstop
    }
  }, []);

  // ─── Iniciar grabación ────────────────────────────────────────────────────
  const iniciarGrabacion = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // Detener tracks del micrófono
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        transcribir(blob);
      };

      recorder.start(100); // chunk cada 100ms
      setEstado('escuchando');
      iniciarDetectorSilencio(stream);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permiso de micrófono denegado.');
      } else {
        setError('No se pudo acceder al micrófono.');
      }
      setEstado('idle');
    }
  }, [iniciarDetectorSilencio, transcribir]);

  // ─── Toggle ───────────────────────────────────────────────────────────────
  const toggleVoz = useCallback(() => {
    if (disabled) return;
    if (estado === 'escuchando') {
      detenerGrabacion();
    } else if (estado === 'idle') {
      iniciarGrabacion();
    }
  }, [estado, iniciarGrabacion, detenerGrabacion]);

  return { estado, error, toggleVoz };
};

export default useSpeechDeepgram;
