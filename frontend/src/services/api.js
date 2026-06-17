const BASE_URL = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) {
    const error = await res.json()
    // .catch(() => ({ detail: res.statusText }))
    console.log(error)
    throw new Error(error.detail || 'Error en el servidor')
  }
  return res.json()
}

export async function getLocalidades() {
  return request('/localidades')
}

export async function getActividades(localidad) {
  return request(`/actividades?localidad=${encodeURIComponent(localidad)}`)
}

export async function sendActividad(actividad) {
  const response = await fetch(`${BASE_URL}/actividad/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(actividad),
  });

  if (!response.ok) throw new Error('Error al generar el audio');

  const blob = await response.blob();         // ← recibe el MP3 como blob
  return URL.createObjectURL(blob);           // ← lo convierte en URL reproducible
}

export async function login(nombreUsuario, password) {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_usuario: nombreUsuario, password }),
  })
}

// ── Secretaría ──────────────────────────────────────────────────────────────

export async function previewSecretaria(file, token) {
  const formData = new FormData()
  formData.append('file', file)
  return request('/admin/secretaria/preview', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
}

export async function uploadSecretaria(file, token) {
  const formData = new FormData()
  formData.append('file', file)
  return request('/admin/secretaria/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
}

// ── SENA ────────────────────────────────────────────────────────────────────

export async function previewSena(file, token, { localidad, fechaInicio, fechaFin }) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('localidad', localidad)
  formData.append('fecha_inicio', fechaInicio)
  if (fechaFin) formData.append('fecha_fin', fechaFin)
  return request('/admin/sena/preview', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
}

export async function uploadSena(file, token, { localidad, fechaInicio, fechaFin }) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('localidad', localidad)
  formData.append('fecha_inicio', fechaInicio)
  if (fechaFin) formData.append('fecha_fin', fechaFin)
  return request('/admin/sena/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
}

// ── CDC (Centros de Desarrollo Comunitario) ──────────────────────────────────

export async function previewCdc(file, token, { localidad, fechaInicio, fechaFin }) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('localidad', localidad)
  formData.append('fecha_inicio', fechaInicio)
  if (fechaFin) formData.append('fecha_fin', fechaFin)
  return request('/admin/cdc/preview', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
}

export async function uploadCdc(file, token, { localidad, fechaInicio, fechaFin }) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('localidad', localidad)
  formData.append('fecha_inicio', fechaInicio)
  if (fechaFin) formData.append('fecha_fin', fechaFin)
  return request('/admin/cdc/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
}

// Alias de compatibilidad
export async function uploadExcel(file, token) {
  return uploadSecretaria(file, token)
}
