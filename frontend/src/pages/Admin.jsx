import { useState } from 'react'
import { login, uploadExcel } from '../services/api'
import HeaderInstitucional from '../components/HeaderInstitucional'

const COLUMNAS_REQUERIDAS = ['titulo', 'localidad', 'lugar', 'fecha_inicio', 'tipo', 'organizador']
const COLUMNAS_OPCIONALES = ['descripcion', 'fecha_fin', 'hora_inicio', 'hora_fin']

export default function Admin() {
  const [token, setToken] = useState(null)
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [loginCargando, setLoginCargando] = useState(false)

  const [archivo, setArchivo] = useState(null)
  const [uploadCargando, setUploadCargando] = useState(false)
  const [uploadResultado, setUploadResultado] = useState(null)
  const [uploadError, setUploadError] = useState(null)

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

  async function handleUpload(e) {
    e.preventDefault()
    if (!archivo) return
    setUploadError(null)
    setUploadResultado(null)
    setUploadCargando(true)
    try {
      const resultado = await uploadExcel(archivo, token)
      setUploadResultado(resultado)
      setArchivo(null)
      e.target.reset()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploadCargando(false)
    }
  }

  function handleLogout() {
    setToken(null)
    setUsuario('')
    setPassword('')
    setUploadResultado(null)
    setArchivo(null)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderInstitucional />

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            {/* Card login */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              {/* Franja superior */}
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
                    id="usuario"
                    type="text"
                    autoComplete="username"
                    required
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 text-gray-900 focus:border-dist focus:outline-none focus:ring-2 focus:ring-dist/20 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 text-gray-900 focus:border-dist focus:outline-none focus:ring-2 focus:ring-dist/20 transition-colors"
                  />
                </div>

                {loginError && (
                  <p className="text-sm text-bogota font-medium bg-bogota/5 border border-bogota/20 rounded-lg px-3 py-2" role="alert">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loginCargando || !usuario || !password}
                  className="w-full bg-bogota hover:bg-bogota-dark disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  {loginCargando ? 'Verificando...' : 'Ingresar'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderInstitucional />

      {/* Subheader admin */}
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Panel de carga */}
        <section
          aria-labelledby="titulo-carga"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="bg-dist px-6 py-4">
            <h2 id="titulo-carga" className="text-white font-bold text-base">
              Cargar cronograma de actividades
            </h2>
            <p className="text-blue-200 text-xs mt-0.5">
              Las filas con errores se reportan individualmente sin detener la carga del resto.
            </p>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label htmlFor="archivo" className="block text-sm font-semibold text-gray-700 mb-2">
                  Seleccionar archivo (.xlsx o .csv)
                </label>
                <input
                  id="archivo"
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(e) => {
                    setArchivo(e.target.files[0] ?? null)
                    setUploadResultado(null)
                  }}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-5 file:rounded-lg file:border-0 file:bg-dist file:text-white file:font-medium file:cursor-pointer hover:file:bg-dist-light transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!archivo || uploadCargando}
                className="bg-bogota hover:bg-bogota-dark disabled:opacity-50 text-white font-semibold px-7 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                {uploadCargando ? 'Procesando archivo...' : 'Subir y procesar'}
              </button>
            </form>

            {uploadError && (
              <p className="mt-4 text-sm text-bogota bg-bogota/5 border border-bogota/20 rounded-lg px-4 py-3 font-medium" role="alert">
                {uploadError}
              </p>
            )}

            {uploadResultado && (
              <div className="mt-5 rounded-xl border border-gray-200 overflow-hidden" role="status" aria-live="polite">
                {/* Resumen */}
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                  <div className="px-5 py-4 text-center">
                    <p className="text-3xl font-bold text-sena">{uploadResultado.insertados}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Actividades cargadas</p>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <p className="text-3xl font-bold text-bogota">{uploadResultado.filas_con_error}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Filas con error</p>
                  </div>
                </div>

                {/* Detalle errores */}
                {uploadResultado.errores?.length > 0 && (
                  <details className="border-t border-gray-200">
                    <summary className="px-5 py-3 text-sm font-semibold text-bogota cursor-pointer hover:bg-red-50 transition-colors">
                      Ver detalle de errores ({uploadResultado.errores.length})
                    </summary>
                    <ul className="px-5 pb-4 pt-2 space-y-2 max-h-64 overflow-y-auto">
                      {uploadResultado.errores.map((e, i) => (
                        <li key={i} className="text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                          <span className="font-bold text-gray-700">Fila {e.fila}:</span>{' '}
                          <span className="text-red-700">{e.errores.join(' · ')}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Guía del formato Excel */}
        <section
          aria-labelledby="titulo-guia"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 id="titulo-guia" className="font-bold text-gray-800 text-sm">
              Formato requerido del archivo
            </h2>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-dist uppercase tracking-wide mb-2">
                Columnas obligatorias
              </p>
              <ul className="flex flex-wrap gap-2">
                {COLUMNAS_REQUERIDAS.map((col) => (
                  <li
                    key={col}
                    className="text-xs font-mono bg-dist/10 text-dist border border-dist/20 px-2.5 py-1 rounded-md"
                  >
                    {col}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Columnas opcionales
              </p>
              <ul className="flex flex-wrap gap-2">
                {COLUMNAS_OPCIONALES.map((col) => (
                  <li
                    key={col}
                    className="text-xs font-mono bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-md"
                  >
                    {col}
                  </li>
                ))}
              </ul>
            </div>

            <table className="w-full text-xs text-left border-collapse" aria-label="Valores válidos por columna">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-700">Columna</th>
                  <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-700">Valores / Formato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['tipo', 'Taller · Evento · Actividad'],
                  ['organizador', 'Secretaría · SENA · Otro'],
                  ['fecha_inicio / fecha_fin', 'DD/MM/YYYY'],
                  ['hora_inicio / hora_fin', 'HH:MM (24 horas)'],
                  ['localidad', 'Nombre exacto de una de las 20 localidades'],
                ].map(([col, val]) => (
                  <tr key={col} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 font-mono text-dist">{col}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-600">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
