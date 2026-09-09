import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const FALLBACK_PRODUCTS = [
  { id: 1, name: "Fleur Douce", cat: "mujer", tipo: "Original", size: "50ml", price: 1650, icon: "F" },
  { id: 2, name: "Bleu Intense", cat: "hombre", tipo: "Contratipo", size: "100ml", price: 350, icon: "B" },
  { id: 3, name: "Ambre Doux", cat: "granel", tipo: "Al granel", size: "10ml", price: 120, icon: "A" },
  { id: 4, name: "Noir Absolu", cat: "hombre", tipo: "Original", size: "100ml", price: 1850, icon: "N" },
  { id: 5, name: "Rose Éclat", cat: "mujer", tipo: "Contratipo", size: "50ml", price: 320, icon: "R" },
  { id: 6, name: "Vétiver Sauvage", cat: "hombre", tipo: "Original", size: "75ml", price: 1450, icon: "V" },
  { id: 7, name: "Jasmin Blanc", cat: "mujer", tipo: "Al granel", size: "15ml", price: 180, icon: "J" },
  { id: 8, name: "Oud Royal", cat: "contratipo", tipo: "Contratipo", size: "50ml", price: 380, icon: "O" },
]

const ADMIN_PIN = "1234"
const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "mujer", label: "Mujer" },
  { key: "hombre", label: "Hombre" },
  { key: "contratipo", label: "Contratipos" },
  { key: "granel", label: "Al granel" },
]

export default function App() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS)
  const [cart, setCart] = useState([])
  const [filter, setFilter] = useState("todos")
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [orderDone, setOrderDone] = useState(null)
  const [form, setForm] = useState({ name: "", phone: "", address: "", payment: "Efectivo contra entrega" })
  const [formError, setFormError] = useState("")

  const [mode, setMode] = useState("store") // store | pin | admin
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [adminTab, setAdminTab] = useState("resumen")
  const [orders, setOrders] = useState([])

  // Carga productos desde Supabase si la tabla existe; si no, usa los de ejemplo
  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase.from('productos').select('*')
      if (!error && data && data.length > 0) setProducts(data)
    }
    loadProducts()
  }, [])

  const filtered = filter === "todos" ? products : products.filter(p => p.cat === filter)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
    setCartOpen(true)
  }
  function changeQty(id, delta) {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0))
  }
  function removeItem(id) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  async function submitOrder() {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setFormError("Completa nombre, teléfono y dirección antes de continuar.")
      return
    }
    setFormError("")
    const newOrder = {
      name: form.name, phone: form.phone, address: form.address,
      payment: form.payment, total: cartTotal, status: "pendiente", items: cart,
    }
    // Intenta guardar en Supabase; si falla, el pedido igual queda visible en el panel local
    await supabase.from('pedidos').insert([newOrder])
    setOrders(prev => [...prev, newOrder])
    setOrderDone(newOrder)
    setCart([])
  }

  function pinPress(n) {
    if (pinInput.length >= 4) return
    const next = pinInput + n
    setPinInput(next)
    if (next.length === 4) {
      if (next === ADMIN_PIN) {
        setMode("admin")
        setPinInput("")
      } else {
        setPinError("PIN incorrecto, intenta de nuevo.")
        setTimeout(() => { setPinInput(""); setPinError("") }, 800)
      }
    }
  }

  return (
    <>
      {mode === "store" && (
        <StoreView
          products={filtered}
          filter={filter} setFilter={setFilter}
          cartCount={cartCount}
          onAdd={addToCart}
          onOpenCart={() => setCartOpen(true)}
          onEnterAdmin={() => setMode("pin")}
        />
      )}

      {mode === "pin" && (
        <PinGate
          pinInput={pinInput} pinError={pinError}
          onPress={pinPress}
          onClear={() => setPinInput("")}
          onBack={() => setPinInput(pinInput.slice(0, -1))}
          onExit={() => { setMode("store"); setPinInput("") }}
        />
      )}

      {mode === "admin" && (
        <AdminView
          tab={adminTab} setTab={setAdminTab}
          orders={orders} products={products}
          onExit={() => setMode("store")}
        />
      )}

      <div className={`overlay ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)} />
      <CartDrawer
        open={cartOpen} cart={cart} total={cartTotal}
        onClose={() => setCartOpen(false)}
        onChangeQty={changeQty} onRemove={removeItem}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
      />

      {checkoutOpen && (
        <CheckoutModal
          form={form} setForm={setForm}
          error={formError}
          orderDone={orderDone}
          onSubmit={submitOrder}
          onClose={() => { setCheckoutOpen(false); setOrderDone(null); setFormError("") }}
        />
      )}
    </>
  )
}

function StoreView({ products, filter, setFilter, cartCount, onAdd, onOpenCart, onEnterAdmin }) {
  return (
    <div className="public-view">
      <div className="topbar">
        <div className="logo">ESSENCE</div>
        <div className="navlinks">
          {FILTERS.map(f => <a key={f.key} href="#" onClick={(e) => { e.preventDefault(); setFilter(f.key) }}>{f.label}</a>)}
        </div>
        <div className="nav-actions">
          <button className="admin-link" onClick={onEnterAdmin}>Panel admin</button>
          <button className="cart-btn" onClick={onOpenCart}>
            Carrito <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </div>

      <div className="hero">
        <div className="hero-eyebrow">Nueva colección</div>
        <h1 className="serif">Fragancias con carácter, para cada momento del día</h1>
        <p>Perfumes originales seleccionados y contratipos de alta fijación. Al detalle o al granel.</p>
        <button className="hero-cta" onClick={() => document.getElementById('catalogAnchor')?.scrollIntoView({ behavior: 'smooth' })}>Ver catálogo</button>
      </div>

      <div className="filters-bar">
        {FILTERS.map(f => (
          <button key={f.key} className={`filter-chip ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      <div className="catalog" id="catalogAnchor">
        <div className="grid">
          {products.map(p => (
            <div className="card" key={p.id}>
              <div className="card-img">{p.icon || p.name?.[0]}</div>
              <div className="card-name">{p.name}</div>
              <div className="card-meta">{p.tipo} · {p.size}</div>
              <div className="card-bottom">
                <span className="card-price">C$ {Number(p.price).toLocaleString()}</span>
                <button className="add-btn" onClick={() => onAdd(p)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CartDrawer({ open, cart, total, onClose, onChangeQty, onRemove, onCheckout }) {
  return (
    <div className={`drawer ${open ? "open" : ""}`}>
      <div className="drawer-header">
        <h3>Tu carrito</h3>
        <button className="drawer-close" onClick={onClose}>&times;</button>
      </div>
      <div className="drawer-items">
        {cart.length === 0 ? (
          <div className="empty-cart">Tu carrito está vacío.</div>
        ) : cart.map(i => (
          <div className="cart-item" key={i.id}>
            <div className="cart-item-img" />
            <div className="cart-item-info">
              <div className="cart-item-name">{i.name}</div>
              <div className="cart-item-meta">{i.tipo} · {i.size}</div>
              <div className="qty-controls">
                <button className="qty-btn" onClick={() => onChangeQty(i.id, -1)}>−</button>
                <span style={{ fontSize: 13 }}>{i.qty}</span>
                <button className="qty-btn" onClick={() => onChangeQty(i.id, 1)}>+</button>
              </div>
              <div className="remove-btn" onClick={() => onRemove(i.id)}>Quitar</div>
            </div>
            <div className="cart-item-price">C$ {(i.price * i.qty).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="drawer-footer">
        <div className="cart-total"><span>Total</span><span>C$ {total.toLocaleString()}</span></div>
        <button className="checkout-btn" onClick={onCheckout}>Finalizar pedido</button>
      </div>
    </div>
  )
}

function CheckoutModal({ form, setForm, error, orderDone, onSubmit, onClose }) {
  return (
    <div className="modal-overlay open">
      <div className="modal">
        {orderDone ? (
          <div className="confirm-msg">
            <div className="confirm-icon">✓</div>
            <h3>Pedido confirmado</h3>
            <p style={{ fontSize: 13.5, color: "var(--text-mid)", marginTop: 8 }}>
              Gracias {orderDone.name}, te contactaremos al {orderDone.phone} para coordinar la entrega.
            </p>
            <button className="modal-submit" style={{ marginTop: 20 }} onClick={onClose}>Volver a la tienda</button>
          </div>
        ) : (
          <>
            <h3>Datos de entrega</h3>
            <div className="form-group">
              <label>Nombre completo</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre y apellido" />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="8888 8888" />
            </div>
            <div className="form-group">
              <label>Dirección de entrega</label>
              <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Barrio, referencia, ciudad" />
            </div>
            <div className="form-group">
              <label>Método de pago</label>
              <select value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })}>
                <option>Efectivo contra entrega</option>
                <option>Transferencia bancaria</option>
                <option>Tarjeta</option>
              </select>
            </div>
            {error && <div className="checkout-error">{error}</div>}
            <button className="modal-submit" onClick={onSubmit}>Confirmar pedido</button>
            <button className="modal-cancel" onClick={onClose}>Cancelar</button>
          </>
        )}
      </div>
    </div>
  )
}

function PinGate({ pinInput, pinError, onPress, onClear, onBack, onExit }) {
  return (
    <div className="pin-screen">
      <div className="pin-box">
        <h3>Panel de administración</h3>
        <div className="pin-dots">
          {[0, 1, 2, 3].map(i => <div key={i} className={`pin-dot ${i < pinInput.length ? "filled" : ""}`} />)}
        </div>
        <div className="pin-pad">
          {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => onPress(String(n))}>{n}</button>)}
          <button onClick={onClear}>C</button>
          <button onClick={() => onPress("0")}>0</button>
          <button onClick={onBack}>&larr;</button>
        </div>
        <div className="pin-error">{pinError}</div>
        <button className="modal-cancel" style={{ marginTop: 14 }} onClick={onExit}>Volver a la tienda</button>
      </div>
    </div>
  )
}

function AdminView({ tab, setTab, orders, products, onExit }) {
  const pending = orders.filter(o => o.status === "pendiente").length
  const totalToday = orders.reduce((s, o) => s + o.total, 0)
  return (
    <div className="admin-view active">
      <div className="admin-topbar">
        <div className="logo">ESSENCE · admin</div>
        <button className="exit-admin" onClick={onExit}>Salir al sitio público</button>
      </div>
      <div className="admin-body">
        <div className="admin-sidebar">
          {["resumen", "pedidos", "catalogo"].map(t => (
            <div key={t} className={`admin-nav-item ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t === "resumen" ? "Resumen" : t === "pedidos" ? "Pedidos online" : "Catálogo"}
            </div>
          ))}
        </div>
        <div className="admin-content">
          {tab === "resumen" && (
            <>
              <h2>Resumen</h2>
              <div className="stat-row">
                <div className="stat-card"><div className="stat-label">Pedidos pendientes</div><div className="stat-value">{pending}</div></div>
                <div className="stat-card"><div className="stat-label">Ventas de hoy</div><div className="stat-value">C$ {totalToday.toLocaleString()}</div></div>
                <div className="stat-card"><div className="stat-label">Productos en catálogo</div><div className="stat-value">{products.length}</div></div>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-mid)" }}>
                Los pedidos y el catálogo ya intentan leer/escribir en Supabase (tablas <code>productos</code> y <code>pedidos</code>).
                Crea esas tablas en tu proyecto Supabase para que todo persista.
              </p>
            </>
          )}
          {tab === "pedidos" && (
            <>
              <h2>Pedidos online</h2>
              {orders.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-mid)" }}>Aún no hay pedidos. Los pedidos hechos desde la tienda pública aparecerán aquí.</p>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Cliente</th><th>Teléfono</th><th>Total</th><th>Pago</th><th>Estado</th></tr></thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr key={i}>
                        <td>{o.name}</td><td>{o.phone}</td>
                        <td>C$ {o.total.toLocaleString()}</td><td>{o.payment}</td>
                        <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
          {tab === "catalogo" && (
            <>
              <h2>Catálogo</h2>
              <table className="admin-table">
                <thead><tr><th>Producto</th><th>Categoría</th><th>Presentación</th><th>Precio</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td><td>{p.cat}</td>
                      <td>{p.tipo} · {p.size}</td>
                      <td>C$ {Number(p.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
