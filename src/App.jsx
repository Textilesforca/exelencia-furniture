import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Contact from './pages/Contact'
import Delivery from './pages/Delivery'
import Cart from './pages/Cart'
import Admin from './pages/Admin'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/catalogo/:id" element={<ProductDetail />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/entrega" element={<Delivery />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/pago/exito" element={<PaymentSuccess />} />
          <Route path="/pago/cancelado" element={<PaymentCancel />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
