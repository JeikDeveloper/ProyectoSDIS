import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'

const NOMBRES = {
  'Usaquen':            'Usaquén',
  'Chapinero':          'Chapinero',
  'Santa Fe':           'Santa Fe',
  'San Cristobal':      'San Cristóbal',
  'Usme':               'Usme',
  'Tunjuelito':         'Tunjuelito',
  'Bosa':               'Bosa',
  'Kennedy':            'Kennedy',
  'Fontibon':           'Fontibón',
  'Engativa':           'Engativá',
  'Suba':               'Suba',
  'Barrios Unidos':     'Barrios Unidos',
  'Teusaquillo':        'Teusaquillo',
  'Los Martires':       'Los Mártires',
  'Antonio Narino':     'Antonio Nariño',
  'Puente Aranda':      'Puente Aranda',
  'La Candelaria':      'La Candelaria',
  'Rafael Uribe Uribe': 'Rafael Uribe Uribe',
  'Ciudad Bolivar':     'Ciudad Bolívar',
  'Sumapaz':            'Sumapaz',
}

function getNombre(props) {
  const raw = (props?.name ?? '').trim()
  return NOMBRES[raw] ?? raw
}

function estiloFeature(seleccionado) {
  return {
    fillColor:   seleccionado ? '#C41230' : '#e2e8f0',
    fillOpacity: seleccionado ? 0.75 : 0.5,
    color:       seleccionado ? '#9E0E25' : '#94a3b8',
    weight:      seleccionado ? 2.5 : 1,
  }
}

export default function MapaBogota({ localidadSeleccionada, onLocalidadClick }) {
  const contenedorRef = useRef(null)
  const mapaRef       = useRef(null)
  const geoLayerRef   = useRef(null)
  const callbackRef   = useRef(onLocalidadClick)
  const [sinArchivo, setSinArchivo] = useState(false)

  useEffect(() => { callbackRef.current = onLocalidadClick }, [onLocalidadClick])

  const initMap = useCallback((container) => {
    if (mapaRef.current) return

    const mapa = L.map(container, { scrollWheelZoom: false, zoomControl: true })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(mapa)

    mapaRef.current = mapa

    fetch('/localidades.geojson')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        const capa = L.geoJSON(data, {
          style: () => estiloFeature(false),
          onEachFeature(feature, layer) {
            const nombre = getNombre(feature.properties)
            layer.on({
              mouseover(e) {
                if (nombre !== callbackRef._selected)
                  e.target.setStyle({ fillColor: '#bfdbfe', fillOpacity: 0.65, weight: 2 })
                e.target.bringToFront()
              },
              mouseout(e)  { capa.resetStyle(e.target) },
              click()      { callbackRef.current(nombre) },
            })
            layer.bindTooltip(nombre, { permanent: false, direction: 'center' })
          },
        }).addTo(mapa)

        geoLayerRef.current = capa
        mapa.fitBounds(capa.getBounds(), { padding: [15, 15] })
      })
      .catch(() => setSinArchivo(true))
  }, [])

  // ResizeObserver: inicializa el mapa solo cuando el contenedor tiene dimensiones reales
  useEffect(() => {
    const container = contenedorRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        if (!mapaRef.current) {
          initMap(container)
        } else {
          mapaRef.current.invalidateSize()
        }
      }
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
      if (mapaRef.current) {
        mapaRef.current.remove()
        mapaRef.current    = null
        geoLayerRef.current = null
      }
    }
  }, [initMap])

  // Actualizar estilos al cambiar localidad seleccionada
  useEffect(() => {
    callbackRef._selected = localidadSeleccionada
    if (!geoLayerRef.current) return
    geoLayerRef.current.eachLayer(layer => {
      const nombre = getNombre(layer.feature?.properties)
      layer.setStyle(estiloFeature(nombre === localidadSeleccionada))
    })
  }, [localidadSeleccionada])

  if (sinArchivo) {
    return (
      <div style={{ height: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '12px', border: '2px dashed #d1d5db' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontWeight: 500, fontSize: '14px' }}>Mapa no disponible</p>
          <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
            Coloca <code style={{ background: '#e5e7eb', padding: '1px 4px', borderRadius: '3px' }}>localidades.geojson</code> en <code style={{ background: '#e5e7eb', padding: '1px 4px', borderRadius: '3px' }}>frontend/public/</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={contenedorRef}
        style={{ height: '480px', width: '100%', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        aria-label="Mapa interactivo de localidades de Bogotá"
      />
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 1000, background: 'rgba(255,255,255,0.92)', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', border: '1px solid #e5e7eb', pointerEvents: 'none', lineHeight: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: '#C41230', display: 'inline-block' }} />
          <span style={{ color: '#374151' }}>Seleccionada</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: '#bfdbfe', display: 'inline-block' }} />
          <span style={{ color: '#374151' }}>Al pasar el cursor</span>
        </div>
      </div>
    </div>
  )
}
