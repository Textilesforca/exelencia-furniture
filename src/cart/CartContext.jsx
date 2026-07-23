import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)

function cargarCarritoInicial() {
  try {
    const guardado = localStorage.getItem('carrito')
    return guardado ? JSON.parse(guardado) : []
  } catch {
    return []
  }
}

function itemId(productoId, color) {
  return `${productoId}::${color || ''}`
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(cargarCarritoInicial)

  useEffect(() => {
    localStorage.setItem('carrito', JSON.stringify(items))
  }, [items])

  function agregar(producto, cantidad, color) {
    setItems((actuales) => {
      const id = itemId(producto.id, color)
      const existente = actuales.find((i) => i.id === id)
      if (existente) {
        return actuales.map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + cantidad } : i))
      }
      return [
        ...actuales,
        {
          id,
          productoId: producto.id,
          nombre: producto.nombre,
          imagen: producto.imagen,
          precio_desde: producto.precio_desde,
          color: color || null,
          cantidad,
        },
      ]
    })
  }

  function quitar(id) {
    setItems((actuales) => actuales.filter((i) => i.id !== id))
  }

  function actualizarCantidad(id, cantidad) {
    if (cantidad < 1) return
    setItems((actuales) => actuales.map((i) => (i.id === id ? { ...i, cantidad } : i)))
  }

  function vaciar() {
    setItems([])
  }

  const total = items.reduce((suma, i) => suma + i.cantidad, 0)

  return (
    <CartContext.Provider value={{ items, agregar, quitar, actualizarCantidad, vaciar, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
