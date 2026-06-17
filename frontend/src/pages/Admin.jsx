import { useState, useEffect } from 'react'
import { login, getLocalidades, previewSecretaria, uploadSecretaria, previewSena, uploadSena, previewCdc, uploadCdc } from '../services/api'
import HeaderInstitucional from '../components/HeaderInstitucional'

// ── Constantes ───────────────────────────────────────────────────────────────

const COLUMNAS_REQUERIDAS = ['titulo', 'localidad', 'lugar', 'fecha_inicio', 'tipo', 'organizador']
const COLUMNAS_OPCIONALES = ['descripcion', 'fecha_fin', 'hora_inicio', 'hora_fin']

// ── Sub-componentes ──────────────────────────────────────────────────────────

function PanelVistaPravia({ preview, onConfirmar, onVolver, cargando }) {
  const hayErrorGlobal = !!preview.error
  const validos       = (preview.filas_procesadas ?? 0) - (preview.filas_con_error ?? 0)
  const errores       = preview.errores ?? []
  const muestra       = preview.muestra ?? []
  const sinValidos    = validos <= 0

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className={`rounded-xl border px-5 py-4 ${hayErrorGlobal || sinValidos ? 'bg-bogota/5 border-bogota/30' : 'bg-sena/5 border-sena/30'}`}>
        {hayErrorGlobal ? (
          <p className="text-bogota font-semibold text-sm">{preview.error}</p>
        ) : (
          <div className="flex flex-wrap gap-6 text-sm">
            <span>
              <span className="font-bold text-2xl text-sena">{validos}</span>
              <span className="text-gray-600 ml-1.5">registros listos para cargar</span>
            </span>
            {errores.length > 0 && (
              <span>
                <span className="font-bold text-2xl text-bogota">{errores.length}</span>
                <span className="text-gray-600 ml-1.5">filas con error (no se cargarán)</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Errores */}
      {errores.length > 0 && (
        <details open className="rounded-xl border border-bogota/20 overflow-hidden">
          <summary className="px-5 py-3 text-sm font-semibold text-bogota cursor-pointer hover:bg-red-50 transition-colors bg-bogota/5">
            Ver errores ({errores.length})
          </summary>
          <ul className="px-5 pb-4 pt-2 space-y-1.5 max-h-48 overflow-y-auto">
            {errores.map((e, i) => (
              <li key={i} className="text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <span className="font-bold text-gray-700">
                  {typeof e.fila === 'number' ? `Fila ${e.fila}` : e.fila}:
                </span>{' '}
                <span className="text-red-700">{Array.isArray(e.errores) ? e.errores.join(' · ') : e.errores}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Muestra */}
      {muestra.length > 0 && !hayErrorGlobal && (
        <div>
          <p className="text-xs font-semibold text-dist uppercase tracking-wide mb-2">
            Muestra — primeros {muestra.length} registros
          </p>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs text-left" aria-label="Muestra de registros a cargar">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th scope="col" className="px-3 py-2 font-semibold text-gray-700">Título</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-gray-700">Lugar</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-gray-700">Tipo</th>
                  {'hoja' in (muestra[0] ?? {}) && (
                    <th scope="col" className="px-3 py-2 font-semibold text-gray-700">Hoja</th>
                  )}
                  {'localidad' in (muestra[0] ?? {}) && (
                    <th scope="col" className="px-3 py-2 font-semibold text-gray-700">Localidad</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {muestra.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-800 max-w-[220px] truncate">{r.titulo}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[180px] truncate">{r.lugar}</td>
                    <td className="px-3 py-2 text-dist font-medium">{r.tipo}</td>
                    {r.hoja      !== undefined && <td className="px-3 py-2 text-gray-500">{r.hoja}</td>}
                    {r.localidad !== undefined && <td className="px-3 py-2 text-gray-500">{r.localidad}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onVolver}
          disabled={cargando}
          className="px-5 py-2.5 rounded-lg border-2 border-gray-400 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-40"
        >
          ← Volver
        </button>
        <button
          onClick={onConfirmar}
          disabled={cargando || hayErrorGlobal || sinValidos}
          className="bg-sena hover:bg-sena-dark disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          aria-disabled={cargando || hayErrorGlobal || sinValidos}
        >
          {cargando ? 'Cargando…' : `✓ Confirmar carga (${validos} registros)`}
        </button>
      </div>
    </div>
  )
}


function PanelResultado({ resultado, onNuevaCarga }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 divide-x divide-gray-200 rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 text-center">
          <p className="text-3xl font-bold text-sena">{resultado.insertados}</p>
          <p className="text-xs text-gray-600 mt-1 font-medium">Registros cargados</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-3xl font-bold text-bogota">{resultado.filas_con_error ?? 0}</p>
          <p className="text-xs text-gray-600 mt-1 font-medium">Filas con error</p>
        </div>
      </div>

      {(resultado.errores?.length ?? 0) > 0 && (
        <details className="rounded-xl border border-bogota/20 overflow-hidden">
          <summary className="px-5 py-3 text-sm font-semibold text-bogota cursor-pointer hover:bg-red-50 bg-bogota/5 transition-colors">
            Ver errores ({resultado.errores.length})
          </summary>
          <ul className="px-5 pb-4 pt-2 space-y-1.5 max-h-48 overflow-y-auto">
            {resultado.errores.map((e, i) => (
              <li key={i} className="text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <span className="font-bold text-gray-700">
                  {typeof e.fila === 'number' ? `Fila ${e.fila}` : e.fila}:
                </span>{' '}
                <span className="text-red-700">{Array.isArray(e.errores) ? e.errores.join(' · ') : e.errores}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <button
        onClick={onNuevaCarga}
        className="w-full mt-2 border-2 border-dist text-dist font-semibold text-sm py-2.5 rounded-lg hover:bg-dist/5 transition-colors"
      >
        Cargar otro archivo
      </button>
    </div>
  )
}


// ── Sección SENA ─────────────────────────────────────────────────────────────

function SeccionSena({ token, localidades }) {
  const [archivo,      setArchivo]      = useState(null)
  const [localidad,    setLocalidad]    = useState('')
  const [fechaInicio,  setFechaInicio]  = useState('')
  const [fechaFin,     setFechaFin]     = useState('')
  const [etapa,        setEtapa]        = useState('formulario') // formulario | vista_previa | resultado
  const [validando,    setValidando]    = useState(false)
  const [cargando,     setCargando]     = useState(false)
  const [preview,      setPreview]      = useState(null)
  const [resultado,    setResultado]    = useState(null)
  const [errorForm,    setErrorForm]    = useState(null)

  const params = { localidad, fechaInicio, fechaFin: fechaFin || undefined }

  async function handleValidar(e) {
    e.preventDefault()
    if (!archivo || !localidad || !fechaInicio) {
      setErrorForm('Completa archivo, localidad y fecha de inicio antes de validar.')
      return
    }
    setErrorForm(null)
    setValidando(true)
    try {
      const data = await previewSena(archivo, token, params)
      setPreview(data)
      setEtapa('vista_previa')
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setValidando(false)
    }
  }

  async function handleConfirmar() {
    setCargando(true)
    try {
      const data = await uploadSena(archivo, token, params)
      setResultado(data)
      setEtapa('resultado')
    } catch (err) {
      setPreview(prev => ({ ...prev, error: err.message }))
    } finally {
      setCargando(false)
    }
  }

  function resetear() {
    setArchivo(null)
    setLocalidad('')
    setFechaInicio('')
    setFechaFin('')
    setPreview(null)
    setResultado(null)
    setErrorForm(null)
    setEtapa('formulario')
  }

  if (etapa === 'resultado') {
    return <PanelResultado resultado={resultado} onNuevaCarga={resetear} />
  }

  if (etapa === 'vista_previa') {
    return (
      <PanelVistaPravia
        preview={preview}
        onConfirmar={handleConfirmar}
        onVolver={() => setEtapa('formulario')}
        cargando={cargando}
      />
    )
  }

  return (
    <form onSubmit={handleValidar} className="space-y-5" noValidate>
      <div>
        <label htmlFor="sena-archivo" className="block text-sm font-semibold text-gray-700 mb-2">
          Archivo Excel — Portafolio de Formación SENA (.xlsx)
        </label>
        <input
          id="sena-archivo"
          type="file"
          accept=".xlsx"
          onChange={e => { setArchivo(e.target.files[0] ?? null); setErrorForm(null) }}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-5 file:rounded-lg file:border-0 file:bg-dist file:text-white file:font-medium file:cursor-pointer hover:file:bg-dist-light transition-colors"
        />
        <p className="text-xs text-gray-600 mt-1.5">
          Archivo: <em>PORTAFOLIO FORMACION REGIONAL DISTRITO CAPITAL</em>. Debe contener las hojas
          Titulada Presencial, Titulada Virtual, Complementaria Virtual y Complementaria Presencial.
        </p>
      </div>

      <p className="text-xs text-gray-600">
        Los campos marcados con <span className="text-bogota font-semibold">*</span> son obligatorios.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="sena-localidad" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Localidad <span className="text-bogota" aria-hidden="true">*</span>
          </label>
          <select
            id="sena-localidad"
            required
            aria-required="true"
            value={localidad}
            onChange={e => setLocalidad(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-500 bg-white px-3 py-2.5 text-gray-900 font-medium focus:border-dist focus:outline-none focus:ring-2 focus:ring-dist/20 transition-colors"
          >
            <option value="">— Selecciona —</option>
            {localidades.map(loc => (
              <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sena-fecha-inicio" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Fecha inicio <span className="text-bogota" aria-hidden="true">*</span>
          </label>
          <input
            id="sena-fecha-inicio"
            type="date"
            required
            aria-required="true"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-500 bg-white px-3 py-2.5 text-gray-900 focus:border-dist focus:outline-none focus:ring-2 focus:ring-dist/20 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="sena-fecha-fin" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Fecha fin <span className="text-gray-500 font-normal">(opcional)</span>
          </label>
          <input
            id="sena-fecha-fin"
            type="date"
            value={fechaFin}
            min={fechaInicio || undefined}
            onChange={e => setFechaFin(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-500 bg-white px-3 py-2.5 text-gray-900 focus:border-dist focus:outline-none focus:ring-2 focus:ring-dist/20 transition-colors"
          />
        </div>
      </div>

      {errorForm && (
        <p className="text-sm text-bogota bg-bogota/5 border border-bogota/20 rounded-lg px-4 py-3 font-medium"
           role="alert" aria-live="assertive" aria-atomic="true">
          {errorForm}
        </p>
      )}

      <button
        type="submit"
        disabled={validando || !archivo || !localidad || !fechaInicio}
        className="bg-dist hover:bg-dist-light disabled:opacity-40 text-white font-semibold px-7 py-2.5 rounded-lg transition-colors shadow-sm"
      >
        {validando ? 'Validando…' : 'Validar archivo'}
      </button>
    </form>
  )
}


// ── Sección Secretaría ───────────────────────────────────────────────────────

function SeccionSecretaria({ token }) {
  const [archivo,   setArchivo]   = useState(null)
  const [etapa,     setEtapa]     = useState('formulario')
  const [validando, setValidando] = useState(false)
  const [cargando,  setCargando]  = useState(false)
  const [preview,   setPreview]   = useState(null)
  const [resultado, setResultado] = useState(null)
  const [errorForm, setErrorForm] = useState(null)

  async function handleValidar(e) {
    e.preventDefault()
    if (!archivo) { setErrorForm('Selecciona un archivo antes de continuar.'); return }
    setErrorForm(null)
    setValidando(true)
    try {
      const data = await previewSecretaria(archivo, token)
      setPreview(data)
      setEtapa('vista_previa')
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setValidando(false)
    }
  }

  async function handleConfirmar() {
    setCargando(true)
    try {
      const data = await uploadSecretaria(archivo, token)
      setResultado(data)
      setEtapa('resultado')
    } catch (err) {
      setPreview(prev => ({ ...prev, error: err.message }))
    } finally {
      setCargando(false)
    }
  }

  function resetear() {
    setArchivo(null)
    setPreview(null)
    setResultado(null)
    setErrorForm(null)
    setEtapa('formulario')
  }

  if (etapa === 'resultado') {
    return <PanelResultado resultado={resultado} onNuevaCarga={resetear} />
  }

  if (etapa === 'vista_previa') {
    return (
      <PanelVistaPravia
        preview={preview}
        onConfirmar={handleConfirmar}
        onVolver={() => setEtapa('formulario')}
        cargando={cargando}
      />
    )
  }

  return (
    <form onSubmit={handleValidar} className="space-y-5" noValidate>
      <div>
        <label htmlFor="sec-archivo" className="block text-sm font-semibold text-gray-700 mb-2">
          Archivo Excel o CSV (.xlsx / .csv)
        </label>
        <input
          id="sec-archivo"
          type="file"
          accept=".xlsx,.csv"
          onChange={e => { setArchivo(e.target.files[0] ?? null); setErrorForm(null) }}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-5 file:rounded-lg file:border-0 file:bg-bogota file:text-white file:font-medium file:cursor-pointer hover:file:bg-bogota-dark transition-colors"
        />
      </div>

      {/* Guía de columnas */}
      <details className="rounded-xl border border-gray-200 overflow-hidden">
        <summary className="px-5 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
          Ver formato requerido del archivo
        </summary>
        <div className="px-5 py-4 space-y-3 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-dist uppercase tracking-wide mb-2">Columnas obligatorias</p>
            <ul className="flex flex-wrap gap-2">
              {COLUMNAS_REQUERIDAS.map(col => (
                <li key={col} className="text-xs font-mono bg-dist/10 text-dist border border-dist/20 px-2.5 py-1 rounded-md">{col}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Columnas opcionales</p>
            <ul className="flex flex-wrap gap-2">
              {COLUMNAS_OPCIONALES.map(col => (
                <li key={col} className="text-xs font-mono bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-md">{col}</li>
              ))}
            </ul>
          </div>
          <table className="w-full text-xs text-left border-collapse" aria-label="Valores válidos por columna">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="border border-gray-200 px-3 py-2 font-semibold text-gray-700">Columna</th>
                <th scope="col" className="border border-gray-200 px-3 py-2 font-semibold text-gray-700">Valores / Formato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['tipo',                    'Taller · Evento · Actividad'],
                ['organizador',             'Secretaría · SENA · Otro'],
                ['fecha_inicio / fecha_fin', 'DD/MM/YYYY'],
                ['hora_inicio / hora_fin',   'HH:MM (24 horas)'],
                ['localidad',               'Nombre exacto de una de las 20 localidades'],
              ].map(([col, val]) => (
                <tr key={col} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-mono text-dist">{col}</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {errorForm && (
        <p className="text-sm text-bogota bg-bogota/5 border border-bogota/20 rounded-lg px-4 py-3 font-medium"
           role="alert" aria-live="assertive" aria-atomic="true">
          {errorForm}
        </p>
      )}

      <button
        type="submit"
        disabled={validando || !archivo}
        className="bg-bogota hover:bg-bogota-dark disabled:opacity-40 text-white font-semibold px-7 py-2.5 rounded-lg transition-colors shadow-sm"
      >
        {validando ? 'Validando…' : 'Validar archivo'}
      </button>
    </form>
  )
}


// ── Sección CDC (Centros de Desarrollo Comunitario) ──────────────────────────

function SeccionCdc({ token, localidades }) {
  const [archivo,     setArchivo]     = useState(null)
  const [localidad,   setLocalidad]   = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin,    setFechaFin]    = useState('')
  const [etapa,       setEtapa]       = useState('formulario') // formulario | vista_previa | resultado
  const [validando,   setValidando]   = useState(false)
  const [cargando,    setCargando]    = useState(false)
  const [preview,     setPreview]     = useState(null)
  const [resultado,   setResultado]   = useState(null)
  const [errorForm,   setErrorForm]   = useState(null)

  const params = { localidad, fechaInicio, fechaFin: fechaFin || undefined }

  async function handleValidar(e) {
    e.preventDefault()
    if (!archivo || !localidad || !fechaInicio) {
      setErrorForm('Completa archivo, localidad y fecha de inicio por defecto antes de validar.')
      return
    }
    setErrorForm(null)
    setValidando(true)
    try {
      const data = await previewCdc(archivo, token, params)
      setPreview(data)
      setEtapa('vista_previa')
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setValidando(false)
    }
  }

  async function handleConfirmar() {
    setCargando(true)
    try {
      const data = await uploadCdc(archivo, token, params)
      setResultado(data)
      setEtapa('resultado')
    } catch (err) {
      setPreview(prev => ({ ...prev, error: err.message }))
    } finally {
      setCargando(false)
    }
  }

  function resetear() {
    setArchivo(null)
    setLocalidad('')
    setFechaInicio('')
    setFechaFin('')
    setPreview(null)
    setResultado(null)
    setErrorForm(null)
    setEtapa('formulario')
  }

  if (etapa === 'resultado') {
    return <PanelResultado resultado={resultado} onNuevaCarga={resetear} />
  }

  if (etapa === 'vista_previa') {
    return (
      <PanelVistaPravia
        preview={preview}
        onConfirmar={handleConfirmar}
        onVolver={() => setEtapa('formulario')}
        cargando={cargando}
      />
    )
  }

  return (
    <form onSubmit={handleValidar} className="space-y-5" noValidate>
      <div>
        <label htmlFor="cdc-archivo" className="block text-sm font-semibold text-gray-700 mb-2">
          Archivo Excel — Oferta disponible CDC (.xlsx)
        </label>
        <input
          id="cdc-archivo"
          type="file"
          accept=".xlsx"
          onChange={e => { setArchivo(e.target.files[0] ?? null); setErrorForm(null) }}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-5 file:rounded-lg file:border-0 file:bg-bogota file:text-white file:font-medium file:cursor-pointer hover:file:bg-bogota-dark transition-colors"
        />
        <p className="text-xs text-gray-600 mt-1.5">
          Oferta de los Centros de Desarrollo Comunitario. Se carga con tipo <em>Actividad</em> y
          organizador <em>Secretaría</em>; las fechas se toman del archivo cuando existen.
        </p>
      </div>

      <p className="text-xs text-gray-600">
        Los campos marcados con <span className="text-bogota font-semibold">*</span> son obligatorios.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="cdc-localidad" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Localidad <span className="text-bogota" aria-hidden="true">*</span>
          </label>
          <select
            id="cdc-localidad"
            required
            aria-required="true"
            value={localidad}
            onChange={e => setLocalidad(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-500 bg-white px-3 py-2.5 text-gray-900 font-medium focus:border-bogota focus:outline-none focus:ring-2 focus:ring-bogota/20 transition-colors"
          >
            <option value="">— Selecciona —</option>
            {localidades.map(loc => (
              <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cdc-fecha-inicio" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Fecha inicio por defecto <span className="text-bogota" aria-hidden="true">*</span>
          </label>
          <input
            id="cdc-fecha-inicio"
            type="date"
            required
            aria-required="true"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-500 bg-white px-3 py-2.5 text-gray-900 focus:border-bogota focus:outline-none focus:ring-2 focus:ring-bogota/20 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="cdc-fecha-fin" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Fecha fin por defecto <span className="text-gray-500 font-normal">(opcional)</span>
          </label>
          <input
            id="cdc-fecha-fin"
            type="date"
            value={fechaFin}
            min={fechaInicio || undefined}
            onChange={e => setFechaFin(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-500 bg-white px-3 py-2.5 text-gray-900 focus:border-bogota focus:outline-none focus:ring-2 focus:ring-bogota/20 transition-colors"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Las fechas del archivo se respetan cuando existen; la fecha por defecto se usa solo en
        actividades marcadas como “POR CONFIRMAR”.
      </p>

      {errorForm && (
        <p className="text-sm text-bogota bg-bogota/5 border border-bogota/20 rounded-lg px-4 py-3 font-medium"
           role="alert" aria-live="assertive" aria-atomic="true">
          {errorForm}
        </p>
      )}

      <button
        type="submit"
        disabled={validando || !archivo || !localidad || !fechaInicio}
        className="bg-bogota hover:bg-bogota-dark disabled:opacity-40 text-white font-semibold px-7 py-2.5 rounded-lg transition-colors shadow-sm"
      >
        {validando ? 'Validando…' : 'Validar archivo'}
      </button>
    </form>
  )
}


// ── Componente principal ─────────────────────────────────────────────────────

export default function Admin() {
  const [token,      setToken]      = useState(null)
  const [usuario,    setUsuario]    = useState('')
  const [password,   setPassword]   = useState('')
  const [loginError, setLoginError] = useState(null)
  const [loginCargando, setLoginCargando] = useState(false)
  const [localidades, setLocalidades] = useState([])
  const [seccion,    setSeccion]    = useState('sena') // 'sena' | 'secretaria'

  useEffect(() => {
    document.title = 'Panel Administrativo — Bogotá D.C. y SENA'
    return () => { document.title = 'Oferta de Actividades y Talleres — Bogotá D.C. y SENA' }
  }, [])

  useEffect(() => {
    if (token) {
      getLocalidades().then(setLocalidades).catch(() => {})
    }
  }, [token])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError(null)
    setLoginCargando(true)
    try {
      const data = await login(usuario, password)
      setToken(data.access_token)
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoginCargando(false)
    }
  }

  function handleLogout() {
    setToken(null)
    setUsuario('')
    setPassword('')
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderInstitucional />
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-dist px-6 py-5">
                <h1 className="text-white text-lg font-bold">Acceso Funcionarios</h1>
                <p className="text-blue-200 text-xs mt-0.5">Panel administrativo de cronogramas</p>
              </div>
              <form onSubmit={handleLogin} noValidate className="px-6 py-6 space-y-4">
                <div>
                  <label htmlFor="usuario" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Usuario
                  </label>
                  <input
                    id="usuario" type="text" autoComplete="username" required
                    value={usuario} onChange={e => setUsuario(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-500 px-3 py-2.5 text-gray-900 focus:border-dist focus:outline-none focus:ring-2 focus:ring-dist/20 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Contraseña
                  </label>
                  <input
                    id="password" type="password" autoComplete="current-password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-500 px-3 py-2.5 text-gray-900 focus:border-dist focus:outline-none focus:ring-2 focus:ring-dist/20 transition-colors"
                  />
                </div>
                {loginError && (
                  <p className="text-sm text-bogota font-medium bg-bogota/5 border border-bogota/20 rounded-lg px-3 py-2"
                     role="alert" aria-live="assertive" aria-atomic="true">
                    {loginError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loginCargando || !usuario || !password}
                  className="w-full bg-bogota hover:bg-bogota-dark disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  {loginCargando ? 'Verificando…' : 'Ingresar'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Panel principal ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderInstitucional />

      {/* Sub-header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sena inline-block" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-700">Sesión activa</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-bogota hover:text-bogota-dark font-medium underline underline-offset-2 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6" role="tablist" aria-label="Tipo de carga">
          <button
            role="tab"
            aria-selected={seccion === 'sena'}
            aria-controls="panel-sena"
            id="tab-sena"
            onClick={() => setSeccion('sena')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              seccion === 'sena'
                ? 'bg-white shadow text-dist'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Carga SENA
          </button>
          {/* Pestaña Secretaría oculta temporalmente (restaurar descomentando)
          <button
            role="tab"
            aria-selected={seccion === 'secretaria'}
            aria-controls="panel-secretaria"
            id="tab-secretaria"
            onClick={() => setSeccion('secretaria')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              seccion === 'secretaria'
                ? 'bg-white shadow text-bogota'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Carga Secretaría
          </button>
          */}
          <button
            role="tab"
            aria-selected={seccion === 'cdc'}
            aria-controls="panel-cdc"
            id="tab-cdc"
            onClick={() => setSeccion('cdc')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              seccion === 'cdc'
                ? 'bg-white shadow text-sena'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Carga CDC
          </button>
        </div>

        {/* Panel SENA */}
        <section
          id="panel-sena"
          role="tabpanel"
          aria-labelledby="tab-sena"
          hidden={seccion !== 'sena'}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="bg-dist px-6 py-4">
            <h2 className="text-white font-bold text-base">Portafolio de Formación SENA</h2>
            <p className="text-blue-200 text-xs mt-0.5">
              Carga programas del Portafolio Regional Distrito Capital 2026
            </p>
          </div>
          <div className="px-6 py-6">
            <SeccionSena token={token} localidades={localidades} />
          </div>
        </section>

        {/* Panel Secretaría oculto temporalmente (restaurar descomentando + la pestaña arriba)
        <section
          id="panel-secretaria"
          role="tabpanel"
          aria-labelledby="tab-secretaria"
          hidden={seccion !== 'secretaria'}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="bg-bogota px-6 py-4">
            <h2 className="text-white font-bold text-base">Cronograma Secretaría de Bogotá</h2>
            <p className="text-white text-xs mt-0.5">
              Carga actividades en el formato estándar de la Secretaría
            </p>
          </div>
          <div className="px-6 py-6">
            <SeccionSecretaria token={token} />
          </div>
        </section>
        */}

        {/* Panel CDC */}
        <section
          id="panel-cdc"
          role="tabpanel"
          aria-labelledby="tab-cdc"
          hidden={seccion !== 'cdc'}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="bg-sena px-6 py-4">
            <h2 className="text-white font-bold text-base">Oferta Centros de Desarrollo Comunitario</h2>
            <p className="text-white text-xs mt-0.5">
              Carga la oferta disponible de los CDC (Secretaría de Integración Social)
            </p>
          </div>
          <div className="px-6 py-6">
            <SeccionCdc token={token} localidades={localidades} />
          </div>
        </section>

      </main>
    </div>
  )
}
