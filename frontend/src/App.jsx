import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Inicio from './pages/Inicio'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="*"
          element={
            <main className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <p className="text-gray-500 mb-4">Página no encontrada</p>
                <Link to="/" className="text-blue-600 underline text-sm">
                  Volver al inicio
                </Link>
              </div>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
