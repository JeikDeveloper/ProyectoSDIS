const BASE_URL = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
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

export async function login(nombreUsuario, password) {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_usuario: nombreUsuario, password }),
  })
}

export async function uploadExcel(file, token) {
  const formData = new FormData()
  formData.append('file', file)
  return request('/admin/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
}
