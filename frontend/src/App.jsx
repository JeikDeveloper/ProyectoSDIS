import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useEffect } from 'react'
import Inicio from './pages/Inicio'
import Admin from './pages/Admin'

function PaginaNoEncontrada() {
  useEffect(() => {
    document.title = 'Página no encontrada — Bogotá D.C. y SENA'
    return () => { document.title = 'Oferta de Actividades y Talleres — Bogotá D.C. y SENA' }
  }, [])
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-2" aria-label="Error 404">404</h1>
        <p className="text-gray-500 mb-4">Página no encontrada</p>
        <Link to="/" className="text-dist underline text-sm font-medium">
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="*"
          element={<PaginaNoEncontrada />}
        />
      </Routes>
    </BrowserRouter>
  )
}
