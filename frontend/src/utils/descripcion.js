/**
 * Parsea el campo `descripcion` de una actividad.
 *
 * Las cargas SENA y CDC arman la descripción como "Etiqueta: valor | Etiqueta: valor | …"
 * (a veces con un campo largo de viñetas, p. ej. Requisitos con "•").
 * Las de Secretaría suelen ser texto libre.
 *
 * Devuelve:
 *   - textoLibre: párrafo sin estructura (Secretaría o partes sin etiqueta)
 *   - datos:      [{ label, value }] para datos cortos (Nivel, Red, Código, Horas…)
 *   - secciones:  [{ label, items }] para campos con viñetas (Requisitos…)
 */
export function parseDescripcion(desc) {
  const vacio = { textoLibre: null, datos: [], secciones: [] }
  if (!desc || typeof desc !== 'string') return vacio

  const datos = []
  const secciones = []
  let textoLibre = null

  for (const parte of desc.split(' | ')) {
    const i = parte.indexOf(': ')
    const label = i > 0 ? parte.slice(0, i).trim() : null
    const value = i > 0 ? parte.slice(i + 2).trim() : parte.trim()

    // Sin etiqueta clara (o etiqueta demasiado larga) → texto libre
    if (!label || label.length > 40) {
      if (parte.trim()) textoLibre = textoLibre ? `${textoLibre} ${parte.trim()}` : parte.trim()
      continue
    }

    if (value.includes('•')) {
      const items = value.split('•').map((s) => s.trim()).filter(Boolean)
      if (items.length) secciones.push({ label, items })
    } else if (value) {
      datos.push({ label, value })
    }
  }

  return { textoLibre, datos, secciones }
}
