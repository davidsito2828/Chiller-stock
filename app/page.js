'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Search, Plus, Minus, ShoppingCart, ClipboardList, CheckCircle2, XCircle, Clock, LogIn, Boxes, Droplets, LayoutDashboard, Bell, ArrowDownToLine, ArrowUpFromLine, Building2, User, FileText, Trash2, Edit3, ArrowRight, Wrench, RefreshCw, Truck, Gauge, AlertTriangle, Calendar } from 'lucide-react';

const AZUL = '#0000DE';
const AZUL_OSC = '#0000A8';
const AZUL_PROF = '#070B34';   // azul noche profundo para sidebar
const TINTA = '#0F172A';
const CIELO = '#0EA5E9';
const LOGO = '/logo-chillersystem.jpeg';

const ROL_LABEL = {
  supervisor: 'Supervisor / Técnico',
  dueno: 'Dueño',
  deposito: 'Depósito / Logística',
};

export default function Home() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('dashboard');

  // Restaurar sesión guardada (solo el dato del usuario, no es login real)
  useEffect(() => {
    const guardado = typeof window !== 'undefined' ? window.sessionStorage.getItem('cs_user') : null;
    if (guardado) setUsuario(JSON.parse(guardado));
  }, []);

  const login = (u) => {
    setUsuario(u);
    window.sessionStorage.setItem('cs_user', JSON.stringify(u));
  };
  const logout = () => {
    setUsuario(null);
    window.sessionStorage.removeItem('cs_user');
  };

  if (!usuario) return <Login onLogin={login} />;
  const rol = usuario.rol;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header usuario={usuario} onLogout={logout} />
      <div style={{ display: 'flex', maxWidth: 1320, margin: '0 auto' }}>
        <Sidebar vista={vista} setVista={setVista} rol={rol} />
        <main style={{ flex: 1, padding: '30px 32px', minHeight: 'calc(100vh - 66px)' }}>
          {vista === 'dashboard' && <Dashboard />}
          {vista === 'stock' && <Stock rol={rol} usuario={usuario} />}
          {vista === 'refrigerantes' && <Refrigerantes rol={rol} usuario={usuario} />}
          {vista === 'cobre' && <Cobre rol={rol} usuario={usuario} />}
          {vista === 'vehiculos' && <Vehiculos rol={rol} usuario={usuario} />}
          {vista === 'carrito' && <Carrito usuario={usuario} onIrPedidos={() => setVista('pedidos')} />}
          {vista === 'pedidos' && <Pedidos rol={rol} usuario={usuario} />}
        </main>
      </div>
    </div>
  );
}

// ============ Carrito global simple (en memoria de sesión) ============
const carritoStore = {
  items: [],
  listeners: new Set(),
  get() { return this.items; },
  set(items) { this.items = items; this.listeners.forEach(l => l(items)); },
  add(item) {
    const ex = this.items.find(c => c.id === item.id);
    if (ex) this.set(this.items.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    else this.set([...this.items, item]);
  },
  subscribe(l) { this.listeners.add(l); return () => this.listeners.delete(l); },
};
function useCarrito() {
  const [items, setItems] = useState(carritoStore.get());
  useEffect(() => carritoStore.subscribe(setItems), []);
  return items;
}

// ========================= LOGIN =========================
function Login({ onLogin }) {
  const [mail, setMail] = useState('');
  const [error, setError] = useState('');
  const [paso, setPaso] = useState('mail');
  const [datosMail, setDatosMail] = useState(null);
  const [cargando, setCargando] = useState(false);

  const validar = async () => {
    const m = mail.trim().toLowerCase();
    if (!m.endsWith('@chillersystem.com')) {
      setError('El acceso es solo con tu correo corporativo @chillersystem.com');
      return;
    }
    setCargando(true);
    const { data: existente } = await supabase.from('usuarios').select('*').eq('mail', m).maybeSingle();
    setCargando(false);
    if (existente) {
      onLogin({ mail: existente.mail, nombre: existente.nombre, rol: existente.rol });
      return;
    }
    const nombre = m.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    setDatosMail({ mail: m, nombre });
    setPaso('rol');
  };

  const elegirRol = async (rol) => {
    await supabase.from('usuarios').insert({ mail: datosMail.mail, nombre: datosMail.nombre, rol });
    onLogin({ ...datosMail, rol });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${AZUL_PROF} 0%, #0A1048 55%, ${AZUL} 130%)` }}>
      <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.22), transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,0,222,0.3), transparent 65%)', pointerEvents: 'none' }} />
      <div className="fadein" style={{ background: '#fff', borderRadius: 22, padding: '42px 38px', width: 420, maxWidth: '100%', boxShadow: '0 30px 90px rgba(7,11,52,0.5)', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <img src={LOGO} alt="Chiller System" style={{ width: 140, marginBottom: 10 }} />
          <h2 style={{ margin: '8px 0 3px', color: TINTA, fontSize: 23, fontWeight: 800, letterSpacing: '-0.5px' }}>Control de Stock</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>Sistema interno · Acceso corporativo</p>
        </div>
        {paso === 'mail' && <>
          <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>Correo de trabajo</label>
          <input value={mail} onChange={e => { setMail(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && validar()}
            placeholder="nombre@chillersystem.com" style={{ width: '100%', padding: '12px 14px', marginTop: 6, marginBottom: 4, borderRadius: 9, border: '1.5px solid #ddd', fontSize: 15, boxSizing: 'border-box', outline: 'none' }} />
          {error && <p style={{ color: '#d32f2f', fontSize: 12.5, margin: '4px 0' }}>{error}</p>}
          <button onClick={validar} disabled={cargando} style={{ width: '100%', marginTop: 14, padding: 13, background: AZUL, color: '#fff', border: 'none', borderRadius: 9, fontSize: 15.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: cargando ? .6 : 1 }}>
            <LogIn size={18} /> {cargando ? 'Verificando...' : 'Continuar'}
          </button>
          <p style={{ marginTop: 18, fontSize: 12, color: '#999', textAlign: 'center' }}>Cualquier correo <b>@chillersystem.com</b> tiene acceso.</p>
        </>}
        {paso === 'rol' && <>
          <p style={{ fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 4 }}>Hola <b>{datosMail.nombre}</b></p>
          <p style={{ fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16 }}>¿Con qué rol vas a trabajar?<br /><span style={{ fontSize: 11.5, color: '#aaa' }}>Se elige una sola vez.</span></p>
          {[['supervisor', 'Supervisor / Técnico', 'Consulta stock y solicita pedidos'],
            ['deposito', 'Depósito / Logística', 'Carga stock, entrega y mueve refrigerantes/cañería']].map(([r, t, d]) => (
            <button key={r} onClick={() => elegirRol(r)}
              style={{ width: '100%', textAlign: 'left', padding: '13px 15px', marginBottom: 9, borderRadius: 10, border: '1.5px solid #e0e0e0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11 }}>
              <ArrowRight size={16} color={AZUL} />
              <div><div style={{ fontWeight: 700, fontSize: 14.5, color: '#222' }}>{t}</div><div style={{ fontSize: 12, color: '#999' }}>{d}</div></div>
            </button>))}
          <div style={{ background: '#FFF8E1', border: '1px solid #ffe082', borderRadius: 9, padding: '10px 12px', margin: '4px 0 10px', fontSize: 11.5, color: '#7c5800' }}>El rol de <b>Gerencia/Dueño</b> está reservado y no puede autoasignarse. Si necesitás otro rol, avisá a David.</div>
          <button onClick={() => setPaso('mail')} style={{ width: '100%', marginTop: 4, padding: 9, background: 'none', border: 'none', color: '#999', fontSize: 13, cursor: 'pointer' }}>← Cambiar correo</button>
        </>}
      </div>
    </div>
  );
}

// ========================= HEADER =========================
function Header({ usuario, onLogout }) {
  return (
    <header style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(15,23,42,0.08)', padding: '0 26px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 4px 20px rgba(7,11,52,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <img src={LOGO} alt="Chiller System" style={{ height: 40 }} />
        <div style={{ height: 26, width: 1, background: 'rgba(15,23,42,0.12)' }} />
        <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, color: '#64748b', letterSpacing: '.5px' }}>Control de Stock</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,222,0.05)', padding: '6px 14px 6px 8px', borderRadius: 30 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${AZUL}, ${CIELO})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: "'Sora', sans-serif" }}>{(usuario.nombre || '?').charAt(0).toUpperCase()}</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TINTA, lineHeight: 1.1 }}>{usuario.nombre}</div>
            <div style={{ fontSize: 10.5, color: AZUL, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>{ROL_LABEL[usuario.rol]}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: '#fff', border: '1.5px solid rgba(15,23,42,0.12)', borderRadius: 9, padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: '#64748b', fontWeight: 600, transition: 'all .15s' }}>Salir</button>
      </div>
    </header>
  );
}

// ========================= SIDEBAR =========================
function Sidebar({ vista, setVista, rol }) {
  const carrito = useCarrito();
  const items = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, roles: ['supervisor', 'dueno', 'deposito'] },
    { id: 'stock', label: 'Stock General', icon: Boxes, roles: ['supervisor', 'dueno', 'deposito'] },
    { id: 'refrigerantes', label: 'Refrigerantes', icon: Droplets, roles: ['supervisor', 'dueno', 'deposito'] },
    { id: 'cobre', label: 'Cañería de Cobre', icon: Wrench, roles: ['supervisor', 'dueno', 'deposito'] },
    { id: 'vehiculos', label: 'Vehículos', icon: Truck, roles: ['supervisor', 'dueno', 'deposito'] },
    { id: 'carrito', label: 'Mi Pedido', icon: ShoppingCart, roles: ['supervisor'], badge: carrito.length },
    { id: 'pedidos', label: 'Pedidos', icon: ClipboardList, roles: ['supervisor', 'dueno', 'deposito'] },
  ];
  return (
    <aside style={{ width: 232, background: `linear-gradient(180deg, ${AZUL_PROF} 0%, #0A1048 100%)`, padding: '22px 16px', minHeight: 'calc(100vh - 66px)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: 200, background: `radial-gradient(circle at 80% 0%, rgba(14,165,233,0.18), transparent 60%)`, pointerEvents: 'none' }} />
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0 12px 12px', position: 'relative' }}>Menú</div>
      {items.filter(i => i.roles.includes(rol)).map((it, idx) => {
        const Icon = it.icon; const active = vista === it.id;
        return (
          <button key={it.id} onClick={() => setVista(it.id)} className="fadein"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 5, borderRadius: 11, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontFamily: "'Sora', sans-serif", fontWeight: active ? 600 : 500, background: active ? `linear-gradient(135deg, ${AZUL}, #2937FF)` : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.6)', position: 'relative', boxShadow: active ? '0 8px 20px rgba(0,0,222,0.4)' : 'none', transition: 'all .18s', animationDelay: `${idx * 0.04}s` }}>
            <Icon size={18} strokeWidth={active ? 2.4 : 2} /> <span style={{ flex: 1 }}>{it.label}</span>
            {it.badge > 0 && <span style={{ background: active ? '#fff' : '#FF3B5C', color: active ? AZUL : '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>{it.badge}</span>}
          </button>);
      })}
      <div style={{ position: 'absolute', bottom: 18, left: 16, right: 16, fontSize: 10.5, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontFamily: "'Sora', sans-serif", letterSpacing: '.5px' }}>CHILLER SYSTEM · 2026</div>
    </aside>
  );
}

// ========================= DASHBOARD =========================
function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    (async () => {
      const [prod, garr, cob, ped] = await Promise.all([
        supabase.from('productos').select('deposito, cantidad'),
        supabase.from('garrafas').select('estado'),
        supabase.from('cobre').select('metros'),
        supabase.from('pedidos').select('estado, numero, solicitante, creado_en').order('creado_en', { ascending: false }).limit(5),
      ]);
      const productos = prod.data || [];
      const garrafas = garr.data || [];
      const cobre = cob.data || [];
      setStats({
        totalItems: productos.length,
        totalUnidades: productos.reduce((a, b) => a + (b.cantidad || 0), 0),
        bajos: productos.filter(p => p.cantidad > 0 && p.cantidad <= 2).length,
        caseros: productos.filter(p => p.deposito === 'Caseros'),
        mataderos: productos.filter(p => p.deposito === 'Mataderos'),
        garrAfuera: garrafas.filter(g => g.estado === 'afuera').length,
        garrTotal: garrafas.length,
        metrosCobre: cobre.reduce((a, b) => a + Number(b.metros || 0), 0),
        pendientes: (ped.data || []).filter(p => p.estado === 'pendiente').length,
        ultimos: ped.data || [],
      });
    })();
  }, []);
  if (!stats) return <Cargando />;
  const cards = [
    { label: 'Ítems en catálogo', value: stats.totalItems, icon: Package, color: AZUL },
    { label: 'Unidades totales', value: stats.totalUnidades, icon: Boxes, color: '#0D9488' },
    { label: 'Stock bajo (≤2)', value: stats.bajos, icon: ArrowDownToLine, color: '#F59E0B' },
    { label: 'Pedidos pendientes', value: stats.pendientes, icon: Clock, color: '#F43F5E' },
  ];
  return (
    <div>
      <SectionTitle icon={LayoutDashboard} title="Panel principal" sub="Resumen general del depósito" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 26 }}>
        {cards.map((c, i) => { const Icon = c.icon; return (
          <div key={i} className="fadein" style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)', position: 'relative', overflow: 'hidden', animationDelay: `${i * 0.06}s` }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: c.color + '0d' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
              <div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 34, fontWeight: 800, color: TINTA, lineHeight: 1, letterSpacing: '-1px' }}>{typeof c.value === 'number' ? c.value.toLocaleString('es-AR') : c.value}</div>
                <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 7, fontWeight: 500 }}>{c.label}</div>
              </div>
              <div style={{ background: c.color + '15', borderRadius: 12, padding: 10, display: 'flex' }}><Icon size={22} color={c.color} strokeWidth={2.2} /></div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, width: '100%', background: c.color, opacity: .85 }} />
          </div>); })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
        <Card title="Stock por depósito">
          {[['Caseros', stats.caseros], ['Mataderos', stats.mataderos]].map(([dep, items]) => {
            const un = items.reduce((a, b) => a + b.cantidad, 0);
            const pct = stats.totalItems ? Math.round((items.length / stats.totalItems) * 100) : 0;
            return (
              <div key={dep} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 5 }}>
                  <b style={{ color: '#333' }}><Building2 size={14} style={{ verticalAlign: -2 }} /> {dep}</b>
                  <span style={{ color: '#888' }}>{items.length} ítems · {un} u.</span>
                </div>
                <div style={{ height: 9, background: '#eee', borderRadius: 5 }}><div style={{ height: '100%', width: pct + '%', background: AZUL, borderRadius: 5 }} /></div>
              </div>);
          })}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #eee', fontSize: 13.5, color: '#666', display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <span><Droplets size={14} color="#0288d1" style={{ verticalAlign: -2 }} /> <b>{stats.garrTotal}</b> garrafas ({stats.garrAfuera} afuera)</span>
            <span><Wrench size={14} color="#b8860b" style={{ verticalAlign: -2 }} /> <b>{stats.metrosCobre}</b> m de cobre</span>
          </div>
        </Card>
        <Card title="Últimos pedidos">
          {stats.ultimos.length === 0 ? <Empty texto="Todavía no hay pedidos cargados" />
            : stats.ultimos.map(p => (
              <div key={p.numero} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div><b style={{ color: AZUL, fontSize: 14 }}>#{p.numero}</b><span style={{ fontSize: 12.5, color: '#777', marginLeft: 8 }}>{p.solicitante}</span></div>
                <EstadoBadge estado={p.estado} />
              </div>))}
        </Card>
      </div>
    </div>
  );
}

// ========================= STOCK =========================
function Stock({ rol, usuario }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [dep, setDep] = useState('Todos');
  const [cat, setCat] = useState('Todas');
  const [modalEntrada, setModalEntrada] = useState(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const carrito = useCarrito();
  const esDeposito = rol === 'deposito';

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('productos').select('*').order('nombre');
    setStock(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  // Rubros fijos + los que ya existan en la base
  const RUBROS = ['Herramientas', 'Insumos', 'Materiales', 'Repuestos'];
  const categorias = useMemo(() => {
    const enBase = Array.from(new Set(stock.map(s => s.categoria).filter(Boolean)));
    const todos = Array.from(new Set([...RUBROS, ...enBase])).sort();
    return ['Todas', ...todos];
  }, [stock]);
  const filtrado = useMemo(() => {
    const q = busca.toLowerCase();
    return stock.filter(s => (dep === 'Todos' || s.deposito === dep) && (cat === 'Todas' || s.categoria === cat) &&
      (q === '' || s.nombre.toLowerCase().includes(q) || (s.marca || '').toLowerCase().includes(q) || (s.codigo || '').toLowerCase().includes(q) || (s.modelo || '').toLowerCase().includes(q))).slice(0, 300);
  }, [stock, busca, dep, cat]);

  const agregarCarrito = (item) => carritoStore.add({ id: item.id, n: item.nombre, ma: item.marca, co: item.codigo, dep: item.deposito, qty: 1, disp: item.cantidad });

  const ingresar = async (item, cant, depDestino) => {
    if (depDestino === item.deposito) {
      await supabase.from('productos').update({ cantidad: item.cantidad + cant }).eq('id', item.id);
    } else {
      const { data: existe } = await supabase.from('productos').select('*').eq('nombre', item.nombre).eq('deposito', depDestino).maybeSingle();
      if (existe) await supabase.from('productos').update({ cantidad: existe.cantidad + cant }).eq('id', existe.id);
      else await supabase.from('productos').insert({ nombre: item.nombre, marca: item.marca, modelo: item.modelo, descripcion: item.descripcion, codigo: item.codigo, categoria: item.categoria, deposito: depDestino, cantidad: cant });
    }
    setModalEntrada(null);
    cargar();
  };

  const crearProducto = async (p) => {
    await supabase.from('productos').insert({ nombre: p.nombre, marca: p.marca, modelo: p.modelo, descripcion: p.descripcion, codigo: p.codigo, categoria: p.categoria, deposito: p.deposito, cantidad: p.cantidad });
    setModalNuevo(false);
    cargar();
  };

  return (
    <div>
      <SectionTitle icon={Boxes} title="Stock General" sub={`${stock.length} ítems · Caseros + Mataderos`} accion={esDeposito ? <button onClick={() => setModalNuevo(true)} style={{ ...btnPri, padding: '8px 14px' }}><Plus size={16} /> Agregar producto</button> : <BotonRefrescar onClick={cargar} />} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={17} color="#999" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nombre, marca, código o modelo..."
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 9, border: '1.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <Select value={dep} onChange={setDep} options={['Todos', 'Caseros', 'Mataderos']} />
        <Select value={cat} onChange={setCat} options={categorias} />
      </div>
      {loading ? <Cargando /> : (
        <div style={{ background: '#fff', borderRadius: 13, overflow: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 760 }}>
            <thead><tr style={{ background: `linear-gradient(135deg, ${AZUL}, #2937FF)`, color: '#fff', textAlign: 'left' }}>
              <th style={th}>Producto</th><th style={th}>Marca / Modelo</th><th style={th}>Rubro</th><th style={th}>Código</th><th style={th}>Depósito</th>
              <th style={{ ...th, textAlign: 'center' }}>Cant.</th><th style={{ ...th, textAlign: 'center', width: 150 }}>Acción</th>
            </tr></thead>
            <tbody>
              {filtrado.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={td}><b style={{ color: '#222' }}>{s.nombre}</b>{s.descripcion && <div style={{ fontSize: 11.5, color: '#999' }}>{s.descripcion}</div>}</td>
                  <td style={td}>{s.marca}{s.modelo && <span style={{ color: '#999' }}> · {s.modelo}</span>}</td>
                  <td style={td}><RubroBadge rubro={s.categoria} /></td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#777' }}>{s.codigo || '—'}</td>
                  <td style={td}><DepBadge dep={s.deposito} /></td>
                  <td style={{ ...td, textAlign: 'center' }}><span style={{ fontWeight: 700, color: s.cantidad === 0 ? '#e53935' : s.cantidad <= 2 ? '#f57c00' : '#222', fontSize: 15 }}>{s.cantidad}</span></td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    {rol === 'supervisor' && <button onClick={() => agregarCarrito(s)} disabled={s.cantidad === 0} style={{ ...btnMini, background: s.cantidad === 0 ? '#ddd' : AZUL, cursor: s.cantidad === 0 ? 'not-allowed' : 'pointer' }}><Plus size={14} /> Pedir</button>}
                    {rol === 'deposito' && <button onClick={() => setModalEntrada(s)} style={{ ...btnMini, background: '#00897b' }}><ArrowDownToLine size={14} /> Ingreso</button>}
                    {rol === 'dueno' && <span style={{ color: '#bbb', fontSize: 12 }}>—</span>}
                  </td>
                </tr>))}
            </tbody>
          </table>
          {filtrado.length === 0 && <Empty texto="No se encontraron productos con ese filtro" />}
        </div>
      )}
      {modalEntrada && <ModalEntrada item={modalEntrada} onClose={() => setModalEntrada(null)} onConfirm={ingresar} />}
      {modalNuevo && <ModalNuevoProducto rubros={['Herramientas', 'Insumos', 'Materiales', 'Repuestos']} onClose={() => setModalNuevo(false)} onConfirm={crearProducto} />}
    </div>
  );
}
function RubroBadge({ rubro }) {
  const colores = { Herramientas: '#8B5CF6', Insumos: '#0EA5E9', Materiales: '#F59E0B', Repuestos: '#10B981' };
  const col = colores[rubro] || '#64748b';
  return <span style={{ background: col + '18', color: col, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>{rubro || 'General'}</span>;
}
function ModalNuevoProducto({ rubros, onClose, onConfirm }) {
  const [f, setF] = useState({ nombre: '', marca: '', modelo: '', codigo: '', descripcion: '', categoria: 'Insumos', deposito: 'Caseros', cantidad: 1 });
  const set = (k, v) => setF({ ...f, [k]: v });
  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ margin: '0 0 16px', color: AZUL }}>Agregar producto nuevo</h3>
      <Field label="Nombre del producto *"><input value={f.nombre} onChange={e => set('nombre', e.target.value)} placeholder="ej: Manómetro digital" style={inp} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Marca"><input value={f.marca} onChange={e => set('marca', e.target.value)} style={inp} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Modelo"><input value={f.modelo} onChange={e => set('modelo', e.target.value)} style={inp} /></Field></div>
      </div>
      <Field label="Código"><input value={f.codigo} onChange={e => set('codigo', e.target.value)} placeholder="opcional" style={inp} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Rubro"><select value={f.categoria} onChange={e => set('categoria', e.target.value)} style={inp}>{rubros.map(r => <option key={r}>{r}</option>)}</select></Field></div>
        <div style={{ flex: 1 }}><Field label="Depósito"><select value={f.deposito} onChange={e => set('deposito', e.target.value)} style={inp}><option>Caseros</option><option>Mataderos</option></select></Field></div>
      </div>
      <Field label="Cantidad inicial"><input type="number" value={f.cantidad} onChange={e => set('cantidad', parseInt(e.target.value) || 0)} style={inp} /></Field>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}><button onClick={onClose} style={{ ...btnSec, flex: 1 }}>Cancelar</button><button onClick={() => f.nombre && onConfirm(f)} style={{ ...btnPri, flex: 1 }}>Agregar</button></div>
    </ModalShell>
  );
}
function ModalEntrada({ item, onClose, onConfirm }) {
  const [cant, setCant] = useState(1);
  const [dep, setDep] = useState(item.deposito);
  const moviendo = dep !== item.deposito;
  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ margin: '0 0 4px', color: AZUL }}>Ingreso de stock</h3>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: '#555' }}><b>{item.nombre}</b></p>
      <div style={{ background: '#F4F6FB', borderRadius: 9, padding: '12px 14px', marginBottom: 16, fontSize: 14 }}>Stock actual en <b>{item.deposito}</b>: <b>{item.cantidad}</b></div>
      <Field label="¿Dónde queda el producto? (lo confirma logística)"><select value={dep} onChange={e => setDep(e.target.value)} style={inp}><option>Caseros</option><option>Mataderos</option></select></Field>
      {moviendo && <div style={{ background: '#fff3e0', borderRadius: 8, padding: '9px 12px', fontSize: 12.5, color: '#e65100', marginBottom: 12 }}>El ingreso se registrará en <b>{dep}</b>.</div>}
      <label style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>Cantidad que ingresa</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 16px' }}>
        <button onClick={() => setCant(Math.max(1, cant - 1))} style={qtyBtn}><Minus size={16} /></button>
        <input type="number" value={cant} onChange={e => setCant(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 80, textAlign: 'center', padding: 9, borderRadius: 8, border: '1.5px solid #ddd', fontSize: 16, fontWeight: 700 }} />
        <button onClick={() => setCant(cant + 1)} style={qtyBtn}><Plus size={16} /></button>
      </div>
      <div style={{ display: 'flex', gap: 10 }}><button onClick={onClose} style={{ ...btnSec, flex: 1 }}>Cancelar</button><button onClick={() => onConfirm(item, cant, dep)} style={{ ...btnPri, flex: 1, background: '#00897b' }}>Confirmar ingreso</button></div>
    </ModalShell>
  );
}

// ========================= REFRIGERANTES =========================
function Refrigerantes({ rol, usuario }) {
  const [garrafas, setGarrafas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filtro, setFiltro] = useState('Todas');
  const esDeposito = rol === 'deposito';

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('garrafas').select('*').order('codigo');
    setGarrafas(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const diasEntre = (iso) => iso ? Math.max(0, Math.round((Date.now() - new Date(iso)) / 86400000)) : 0;

  const salida = async (d) => {
    await supabase.from('garrafas').update({ estado: 'afuera', supervisor: d.supervisor, destino: d.destino, salida: new Date().toISOString(), regreso: null, dias: null }).eq('id', d.garrafaId);
    setModal(null); cargar();
  };
  const regreso = async (d) => {
    const g = garrafas.find(x => x.id === d.garrafaId);
    const dias = diasEntre(g.salida);
    await supabase.from('garrafas').update({ estado: 'vacia', regreso: new Date().toISOString(), dias, quien_devuelve: d.quienDevuelve }).eq('id', d.garrafaId);
    setModal(null); cargar();
  };
  const recargar = async (id) => {
    await supabase.from('garrafas').update({ estado: 'disponible', supervisor: null, destino: null, salida: null, regreso: null, dias: null, quien_devuelve: null }).eq('id', id);
    cargar();
  };
  const nueva = async (d) => {
    await supabase.from('garrafas').insert({ codigo: d.codigo, gas: d.gas, tipo_garrafa: d.tg, marca: d.ma, estado: 'disponible' });
    setModal(null); cargar();
  };
  const eliminar = async (id) => { await supabase.from('garrafas').delete().eq('id', id); cargar(); };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('es-AR') : '—';
  const disponibles = garrafas.filter(g => g.estado === 'disponible').length;
  const afuera = garrafas.filter(g => g.estado === 'afuera').length;
  const vacias = garrafas.filter(g => g.estado === 'vacia').length;
  const lista = filtro === 'Todas' ? garrafas : garrafas.filter(g => g.estado === filtro);

  return (
    <div>
      <SectionTitle icon={Droplets} title="Refrigerantes — Control de Garrafas" sub="Trazabilidad individual · sale llena / vuelve vacía" accion={<BotonRefrescar onClick={cargar} />} />
      <div style={{ background: '#E1F5FE', border: '1px solid #b3e5fc', borderRadius: 11, padding: '13px 16px', marginBottom: 18, fontSize: 13.5, color: '#01579b' }}>
        <b>Ciclo de cada garrafa:</b> logística registra cuando <b>sale</b> (a qué supervisor y destino) y cuando <b>vuelve vacía</b> (quién la devuelve y los días afuera, calculados solos). {!esDeposito && <span>Solo <b>Depósito/Logística</b> registra movimientos.</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
        {[['Disponibles (llenas)', disponibles, '#2e7d32', CheckCircle2], ['Afuera (en la calle)', afuera, '#e65100', ArrowUpFromLine], ['Vacías (a recargar)', vacias, '#c62828', ArrowDownToLine]].map(([t, v, col, Ic]) => (
          <div key={t} style={{ background: '#fff', borderRadius: 13, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,.05)', borderLeft: `4px solid ${col}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a' }}>{v}</div><div style={{ fontSize: 12.5, color: '#888' }}>{t}</div></div><Ic size={24} color={col} />
          </div>))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {['Todas', 'disponible', 'afuera', 'vacia'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid ' + (filtro === f ? '#0288d1' : '#ddd'), background: filtro === f ? '#0288d1' : '#fff', color: filtro === f ? '#fff' : '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{f === 'Todas' ? 'Todas' : f === 'disponible' ? 'Disponibles' : f === 'afuera' ? 'Afuera' : 'Vacías'}</button>))}
        {esDeposito && <button onClick={() => setModal({ tipo: 'nueva' })} style={{ ...btnPri, background: '#0288d1', marginLeft: 'auto' }}><Plus size={16} /> Nueva garrafa</button>}
      </div>
      {loading ? <Cargando /> : (
        <div style={{ background: '#fff', borderRadius: 13, overflow: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
            <thead><tr style={{ background: 'linear-gradient(135deg, #0284C7, #0EA5E9)', color: '#fff', textAlign: 'left' }}>
              <th style={th}>Garrafa</th><th style={th}>Gas / Tipo</th><th style={th}>Estado</th><th style={th}>Supervisor</th><th style={th}>Destino</th><th style={th}>Salida</th><th style={th}>Días</th><th style={th}>Regreso</th>{esDeposito && <th style={{ ...th, textAlign: 'center', width: 180 }}>Acción</th>}
            </tr></thead>
            <tbody>
              {lista.map(g => {
                const da = g.estado === 'afuera' ? diasEntre(g.salida) : null;
                return (
                  <tr key={g.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={td}><b style={{ color: '#01579b', fontSize: 14 }}>{g.codigo}</b></td>
                    <td style={td}><span style={{ background: gasColor(g.gas) + '20', color: gasColor(g.gas), fontWeight: 700, fontSize: 12, padding: '2px 9px', borderRadius: 14 }}>{g.gas.toUpperCase()}</span><div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>{g.tipo_garrafa}</div></td>
                    <td style={td}><GarrafaEstado estado={g.estado} /></td>
                    <td style={td}>{g.supervisor || '—'}</td><td style={td}>{g.destino || '—'}</td><td style={td}>{fmt(g.salida)}</td>
                    <td style={td}>{g.estado === 'afuera' ? <b style={{ color: da > 30 ? '#c62828' : '#e65100' }}>{da} d</b> : g.dias != null ? <b style={{ color: '#555' }}>{g.dias} d</b> : '—'}</td>
                    <td style={td}>{g.regreso ? <span>{fmt(g.regreso)}{g.quien_devuelve && <div style={{ fontSize: 11, color: '#999' }}>por {g.quien_devuelve}</div>}</span> : '—'}</td>
                    {esDeposito && <td style={{ ...td, textAlign: 'center' }}>
                      {g.estado === 'disponible' && <button onClick={() => setModal({ tipo: 'salida', garrafa: g })} style={{ ...btnMini, background: '#e65100' }}><ArrowUpFromLine size={13} /> Sale</button>}
                      {g.estado === 'afuera' && <button onClick={() => setModal({ tipo: 'regreso', garrafa: g })} style={{ ...btnMini, background: '#00897b' }}><ArrowDownToLine size={13} /> Volvió vacía</button>}
                      {g.estado === 'vacia' && <button onClick={() => recargar(g.id)} style={{ ...btnMini, background: '#0288d1' }}><CheckCircle2 size={13} /> Recargada</button>}
                      <button onClick={() => eliminar(g.id)} style={{ ...btnMini, background: '#fff', color: '#c62828', border: '1.5px solid #ffcdd2', marginLeft: 5 }}><Trash2 size={13} /></button>
                    </td>}
                  </tr>);
              })}
            </tbody>
          </table>
          {lista.length === 0 && <Empty texto="No hay garrafas en este estado" />}
        </div>
      )}
      {modal?.tipo === 'salida' && <ModalSalidaGarrafa garrafa={modal.garrafa} onClose={() => setModal(null)} onConfirm={salida} />}
      {modal?.tipo === 'regreso' && <ModalRegresoGarrafa garrafa={modal.garrafa} dias={diasEntre(modal.garrafa.salida)} onClose={() => setModal(null)} onConfirm={regreso} />}
      {modal?.tipo === 'nueva' && <ModalNuevaGarrafa onClose={() => setModal(null)} onConfirm={nueva} />}
    </div>
  );
}
function GarrafaEstado({ estado }) {
  const map = { disponible: ['#e8f5e9', '#2e7d32', 'Disponible'], afuera: ['#fff3e0', '#e65100', 'Afuera'], vacia: ['#ffebee', '#c62828', 'Vacía'] };
  const [bg, col, txt] = map[estado] || map.disponible;
  return <span style={{ background: bg, color: col, fontSize: 12, fontWeight: 700, padding: '3px 11px', borderRadius: 20 }}>{txt}</span>;
}
function ModalSalidaGarrafa({ garrafa, onClose, onConfirm }) {
  const [supervisor, setSupervisor] = useState('');
  const [destino, setDestino] = useState('');
  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ margin: '0 0 4px', color: '#e65100' }}>Salida de garrafa (llena)</h3>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: '#555' }}>Garrafa <b>{garrafa.codigo}</b> · {garrafa.gas.toUpperCase()} · {garrafa.tipo_garrafa}</p>
      <Field label="¿A qué supervisor/técnico se entrega?"><input value={supervisor} onChange={e => setSupervisor(e.target.value)} placeholder="ej: Juan Pérez" style={inp} /></Field>
      <Field label="Destino (obra / cliente)"><input value={destino} onChange={e => setDestino(e.target.value)} placeholder="ej: Obra Torre Maipú" style={inp} /></Field>
      <div style={{ background: '#fff3e0', borderRadius: 8, padding: '9px 12px', fontSize: 12.5, color: '#e65100', margin: '4px 0 16px' }}>Se registra la salida de hoy. Los días afuera se cuentan solos hasta que vuelva.</div>
      <div style={{ display: 'flex', gap: 10 }}><button onClick={onClose} style={{ ...btnSec, flex: 1 }}>Cancelar</button><button onClick={() => supervisor && onConfirm({ garrafaId: garrafa.id, supervisor, destino })} style={{ ...btnPri, flex: 1, background: '#e65100' }}>Registrar salida</button></div>
    </ModalShell>
  );
}
function ModalRegresoGarrafa({ garrafa, dias, onClose, onConfirm }) {
  const [quienDevuelve, setQuienDevuelve] = useState(garrafa.supervisor || '');
  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ margin: '0 0 4px', color: '#00897b' }}>Regreso de garrafa (vacía)</h3>
      <p style={{ margin: '0 0 14px', fontSize: 14, color: '#555' }}>Garrafa <b>{garrafa.codigo}</b> · salió el {new Date(garrafa.salida).toLocaleDateString('es-AR')} con {garrafa.supervisor}</p>
      <div style={{ background: '#e8f5e9', borderRadius: 9, padding: '12px 14px', marginBottom: 14, fontSize: 14, color: '#2e7d32' }}>Estuvo afuera: <b>{dias} día{dias !== 1 ? 's' : ''}</b> (cálculo automático)</div>
      <Field label="¿Quién devuelve la garrafa vacía?"><input value={quienDevuelve} onChange={e => setQuienDevuelve(e.target.value)} placeholder="ej: Juan Pérez" style={inp} /></Field>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}><button onClick={onClose} style={{ ...btnSec, flex: 1 }}>Cancelar</button><button onClick={() => quienDevuelve && onConfirm({ garrafaId: garrafa.id, quienDevuelve })} style={{ ...btnPri, flex: 1, background: '#00897b' }}>Confirmar regreso</button></div>
    </ModalShell>
  );
}
function ModalNuevaGarrafa({ onClose, onConfirm }) {
  const [f, setF] = useState({ gas: 'R410a', num: '', tg: 'Garrafa 13,60 KG', ma: '' });
  const codigo = f.gas.toUpperCase() + (f.num ? '-' + f.num : '');
  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ margin: '0 0 16px', color: '#0288d1' }}>Registrar nueva garrafa</h3>
      <Field label="Tipo de gas"><select value={f.gas} onChange={e => setF({ ...f, gas: e.target.value })} style={inp}><option>R410a</option><option>R134a</option><option>R22</option><option>R32</option><option>R407c</option></select></Field>
      <Field label="N° de garrafa (lo asigna logística)"><input value={f.num} onChange={e => setF({ ...f, num: e.target.value })} placeholder="ej: 10" style={inp} /></Field>
      <Field label="Tipo / peso"><input value={f.tg} onChange={e => setF({ ...f, tg: e.target.value })} style={inp} /></Field>
      <Field label="Marca"><input value={f.ma} onChange={e => setF({ ...f, ma: e.target.value })} style={inp} /></Field>
      <div style={{ background: '#E1F5FE', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#01579b', margin: '4px 0 16px' }}>Código: <b>{codigo || '(falta n°)'}</b></div>
      <div style={{ display: 'flex', gap: 10 }}><button onClick={onClose} style={{ ...btnSec, flex: 1 }}>Cancelar</button><button onClick={() => f.num && onConfirm({ ...f, codigo })} style={{ ...btnPri, flex: 1, background: '#0288d1' }}>Registrar</button></div>
    </ModalShell>
  );
}

// ========================= CAÑERÍA DE COBRE =========================
function Cobre({ rol, usuario }) {
  const [cobre, setCobre] = useState([]);
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const esDeposito = rol === 'deposito';

  const cargar = useCallback(async () => {
    setLoading(true);
    const [c, m] = await Promise.all([
      supabase.from('cobre').select('*').order('id'),
      supabase.from('movimientos_cobre').select('*').order('fecha', { ascending: false }).limit(50),
    ]);
    setCobre(c.data || []); setMovs(m.data || []); setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const registrarMov = async (d) => {
    const { tipo, item, metros, destino } = d;
    const nuevo = tipo === 'entrada' ? Number(item.metros) + metros : Math.max(0, Number(item.metros) - metros);
    await supabase.from('cobre').update({ metros: nuevo }).eq('id', item.id);
    await supabase.from('movimientos_cobre').insert({ cobre_id: item.id, tipo, medida: item.medida, deposito: item.deposito, metros, destino: tipo === 'salida' ? destino : null, usuario: usuario.nombre });
    setModal(null); cargar();
  };
  const agregarMedida = async (d) => { await supabase.from('cobre').insert({ medida: d.medida, deposito: d.dep, metros: d.metros }); setModal(null); cargar(); };
  const editarMedida = async (d) => { await supabase.from('cobre').update({ medida: d.medida }).eq('id', d.id); setModal(null); cargar(); };

  const fmt = (iso) => new Date(iso).toLocaleDateString('es-AR');
  return (
    <div>
      <SectionTitle icon={Wrench} title="Cañería de Cobre" sub="Control por metros · medidas en pulgadas" accion={<BotonRefrescar onClick={cargar} />} />
      <div style={{ background: '#FFF8E1', border: '1px solid #ffe082', borderRadius: 11, padding: '13px 16px', marginBottom: 18, fontSize: 13.5, color: '#7c5800' }}>
        <b>Stock en metros.</b> Podés agregar o modificar medidas. {!esDeposito && <span>Solo <b>Depósito/Logística</b> registra entradas/salidas.</span>}
      </div>
      {loading ? <Cargando /> : <>
        <div style={{ background: '#fff', borderRadius: 13, overflow: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,.05)', marginBottom: 22 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 500 }}>
            <thead><tr style={{ background: 'linear-gradient(135deg, #B45309, #F59E0B)', color: '#fff', textAlign: 'left' }}>
              <th style={th}>Medida (pulg.)</th><th style={th}>Depósito</th><th style={{ ...th, textAlign: 'center' }}>Metros</th>{esDeposito && <th style={{ ...th, textAlign: 'center', width: 260 }}>Acciones</th>}
            </tr></thead>
            <tbody>
              {cobre.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={td}><b style={{ fontSize: 15, color: '#7c5800' }}>{c.medida}&quot;</b></td>
                  <td style={td}><DepBadge dep={c.deposito} /></td>
                  <td style={{ ...td, textAlign: 'center' }}><span style={{ fontSize: 18, fontWeight: 800, color: c.metros == 0 ? '#e53935' : '#7c5800' }}>{c.metros} m</span></td>
                  {esDeposito && <td style={{ ...td, textAlign: 'center' }}>
                    <button onClick={() => setModal({ tipo: 'entrada', item: c })} style={{ ...btnMini, background: '#00897b', marginRight: 5 }}><ArrowDownToLine size={13} /> Entra</button>
                    <button onClick={() => setModal({ tipo: 'salida', item: c })} disabled={c.metros == 0} style={{ ...btnMini, background: c.metros == 0 ? '#ddd' : '#e65100', marginRight: 5, cursor: c.metros == 0 ? 'not-allowed' : 'pointer' }}><ArrowUpFromLine size={13} /> Sale</button>
                    <button onClick={() => setModal({ tipo: 'editar', item: c })} style={{ ...btnMini, background: '#607d8b' }}><Edit3 size={13} /></button>
                  </td>}
                </tr>))}
            </tbody>
          </table>
        </div>
        {esDeposito && <button onClick={() => setModal({ tipo: 'nueva' })} style={{ ...btnPri, background: '#b8860b', marginBottom: 22 }}><Plus size={16} /> Agregar medida</button>}
        <Card title={`Historial de movimientos (${movs.length})`}>
          {movs.length === 0 ? <Empty texto="Sin movimientos registrados" /> : (
            <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
              <thead><tr style={{ textAlign: 'left', color: '#888', borderBottom: '2px solid #eee' }}>
                <th style={thb}>Fecha</th><th style={thb}>Tipo</th><th style={thb}>Medida</th><th style={thb}>Depósito</th><th style={thb}>Destino</th><th style={thb}>Metros</th><th style={thb}>Usuario</th>
              </tr></thead>
              <tbody>{movs.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={tdb}>{fmt(m.fecha)}</td>
                  <td style={tdb}><span style={{ color: m.tipo === 'entrada' ? '#00897b' : '#e65100', fontWeight: 700 }}>{m.tipo === 'entrada' ? '↓ Entrada' : '↑ Salida'}</span></td>
                  <td style={tdb}><b>{m.medida}&quot;</b></td><td style={tdb}>{m.deposito}</td><td style={tdb}>{m.destino || '—'}</td><td style={tdb}><b>{m.metros} m</b></td><td style={tdb}>{m.usuario}</td>
                </tr>))}</tbody>
            </table></div>
          )}
        </Card>
      </>}
      {(modal?.tipo === 'entrada' || modal?.tipo === 'salida') && <ModalMovCobre data={modal} onClose={() => setModal(null)} onConfirm={registrarMov} />}
      {modal?.tipo === 'nueva' && <ModalNuevaMedida onClose={() => setModal(null)} onConfirm={agregarMedida} />}
      {modal?.tipo === 'editar' && <ModalEditarMedida item={modal.item} onClose={() => setModal(null)} onConfirm={editarMedida} />}
    </div>
  );
}
function ModalMovCobre({ data, onClose, onConfirm }) {
  const { tipo, item } = data;
  const [metros, setMetros] = useState(1);
  const [destino, setDestino] = useState('');
  const entrada = tipo === 'entrada';
  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ margin: '0 0 4px', color: entrada ? '#00897b' : '#e65100' }}>{entrada ? 'Entrada' : 'Salida'} de cañería</h3>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: '#555' }}>Medida <b>{item.medida}&quot;</b> · {item.deposito} · stock {item.metros} m</p>
      <Field label="Metros"><input type="number" step="0.5" value={metros} onChange={e => setMetros(Math.max(0.5, parseFloat(e.target.value) || 0.5))} style={inp} /></Field>
      {!entrada && <Field label="Destino (base u obra)"><input value={destino} onChange={e => setDestino(e.target.value)} placeholder="ej: Obra Quilmes" style={inp} /></Field>}
      <div style={{ background: entrada ? '#e8f5e9' : '#fff3e0', borderRadius: 8, padding: '9px 12px', fontSize: 13, margin: '4px 0 16px', color: entrada ? '#2e7d32' : '#e65100' }}>Nuevo stock: <b>{entrada ? Number(item.metros) + metros : Math.max(0, Number(item.metros) - metros)} m</b></div>
      <div style={{ display: 'flex', gap: 10 }}><button onClick={onClose} style={{ ...btnSec, flex: 1 }}>Cancelar</button><button onClick={() => onConfirm({ tipo, item, metros, destino })} style={{ ...btnPri, flex: 1, background: entrada ? '#00897b' : '#e65100' }}>Confirmar</button></div>
    </ModalShell>
  );
}
function ModalNuevaMedida({ onClose, onConfirm }) {
  const [f, setF] = useState({ medida: '', metros: 0, dep: 'Caseros' });
  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ margin: '0 0 16px', color: '#b8860b' }}>Agregar medida de cañería</h3>
      <Field label="Medida (pulgadas)"><input value={f.medida} onChange={e => setF({ ...f, medida: e.target.value })} placeholder="ej: 1-1/8" style={inp} /></Field>
      <Field label="Depósito"><select value={f.dep} onChange={e => setF({ ...f, dep: e.target.value })} style={inp}><option>Caseros</option><option>Mataderos</option></select></Field>
      <Field label="Metros iniciales"><input type="number" value={f.metros} onChange={e => setF({ ...f, metros: parseFloat(e.target.value) || 0 })} style={inp} /></Field>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}><button onClick={onClose} style={{ ...btnSec, flex: 1 }}>Cancelar</button><button onClick={() => f.medida && onConfirm(f)} style={{ ...btnPri, flex: 1, background: '#b8860b' }}>Agregar</button></div>
    </ModalShell>
  );
}
function ModalEditarMedida({ item, onClose, onConfirm }) {
  const [medida, setMedida] = useState(item.medida);
  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ margin: '0 0 16px', color: '#607d8b' }}>Modificar medida</h3>
      <Field label="Medida (pulgadas)"><input value={medida} onChange={e => setMedida(e.target.value)} style={inp} /></Field>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}><button onClick={onClose} style={{ ...btnSec, flex: 1 }}>Cancelar</button><button onClick={() => onConfirm({ id: item.id, medida })} style={{ ...btnPri, flex: 1, background: '#607d8b' }}>Guardar</button></div>
    </ModalShell>
  );
}

// ========================= CARRITO =========================
function Carrito({ usuario, onIrPedidos }) {
  const carrito = useCarrito();
  const [datos, setDatos] = useState({ presupuesto: '', obra: '', cliente: '' });
  const [guardando, setGuardando] = useState(false);
  const cambiarQty = (id, delta) => carritoStore.set(carrito.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  const quitar = (id) => carritoStore.set(carrito.filter(c => c.id !== id));

  const confirmar = async () => {
    setGuardando(true);
    // numeración correlativa
    const { data: cont } = await supabase.from('contador_pedidos').select('ultimo').eq('id', 1).single();
    const nuevoNum = (cont?.ultimo || 0) + 1;
    const numero = String(nuevoNum).padStart(4, '0');
    const { data: pedido } = await supabase.from('pedidos').insert({
      numero, solicitante: usuario.nombre, mail: usuario.mail,
      presupuesto: datos.presupuesto || null, obra: datos.obra || null, cliente: datos.cliente || null, estado: 'pendiente',
    }).select().single();
    if (pedido) {
      await supabase.from('pedido_items').insert(carrito.map(c => ({ pedido_id: pedido.id, producto_id: c.id, nombre: c.n, marca: c.ma, deposito: c.dep, cantidad: c.qty })));
      await supabase.from('contador_pedidos').update({ ultimo: nuevoNum }).eq('id', 1);
    }
    carritoStore.set([]);
    setGuardando(false);
    onIrPedidos();
  };

  return (
    <div>
      <SectionTitle icon={ShoppingCart} title="Mi Pedido" sub="Armá tu solicitud y confirmala" />
      {carrito.length === 0 ? <Card><Empty texto="Tu pedido está vacío. Andá a 'Stock General' y agregá productos con el botón Pedir." /></Card>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          <Card title={`Productos solicitados (${carrito.length})`}>
            {carrito.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ flex: 1 }}><b style={{ fontSize: 14, color: '#222' }}>{c.n}</b><div style={{ fontSize: 12, color: '#999' }}>{c.ma} · {c.dep} · disp: {c.disp}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <button onClick={() => cambiarQty(c.id, -1)} style={qtyBtnSm}><Minus size={13} /></button>
                  <span style={{ fontWeight: 700, minWidth: 22, textAlign: 'center' }}>{c.qty}</span>
                  <button onClick={() => cambiarQty(c.id, 1)} style={qtyBtnSm}><Plus size={13} /></button>
                </div>
                <button onClick={() => quitar(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53935' }}><XCircle size={18} /></button>
              </div>))}
          </Card>
          <Card title="Datos del pedido">
            <Field label="N° de Presupuesto"><input value={datos.presupuesto} onChange={e => setDatos({ ...datos, presupuesto: e.target.value })} placeholder="ej: PPTO-1234" style={inp} /></Field>
            <Field label="Obra"><input value={datos.obra} onChange={e => setDatos({ ...datos, obra: e.target.value })} placeholder="ej: Torre Maipú P20" style={inp} /></Field>
            <Field label="Cliente"><input value={datos.cliente} onChange={e => setDatos({ ...datos, cliente: e.target.value })} placeholder="ej: Banco Galicia" style={inp} /></Field>
            <div style={{ background: '#F4F6FB', borderRadius: 9, padding: '11px 13px', margin: '6px 0 14px', fontSize: 12.5, color: '#666' }}>Solicitante: <b>{usuario.nombre}</b><br />Queda pendiente de aprobación del dueño.</div>
            <button onClick={confirmar} disabled={guardando} style={{ ...btnPri, width: '100%', justifyContent: 'center', opacity: guardando ? .6 : 1 }}><CheckCircle2 size={17} /> {guardando ? 'Guardando...' : 'Confirmar pedido'}</button>
          </Card>
        </div>}
    </div>
  );
}

// ========================= PEDIDOS =========================
function Pedidos({ rol, usuario }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todos');
  const [confirmDel, setConfirmDel] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('pedidos').select('*, pedido_items(*)').order('creado_en', { ascending: false });
    setPedidos(data || []); setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const aprobar = async (id) => { await supabase.from('pedidos').update({ estado: 'aprobado' }).eq('id', id); cargar(); };
  const rechazar = async (id) => { await supabase.from('pedidos').update({ estado: 'rechazado' }).eq('id', id); cargar(); };
  const eliminar = async (id) => { await supabase.from('pedidos').delete().eq('id', id); setConfirmDel(null); cargar(); };
  const entregar = async (pedido) => {
    for (const it of pedido.pedido_items) {
      if (it.producto_id) {
        const { data: prod } = await supabase.from('productos').select('cantidad').eq('id', it.producto_id).single();
        if (prod) await supabase.from('productos').update({ cantidad: Math.max(0, prod.cantidad - it.cantidad) }).eq('id', it.producto_id);
      }
    }
    await supabase.from('pedidos').update({ estado: 'entregado' }).eq('id', pedido.id);
    cargar();
  };

  const puedeBorrar = (p) => rol === 'dueno' || rol === 'deposito' || (rol === 'supervisor' && p.mail === usuario.mail);
  const lista = filtro === 'Todos' ? pedidos : pedidos.filter(p => p.estado === filtro);
  const fmt = (iso) => new Date(iso).toLocaleString('es-AR');

  return (
    <div>
      <SectionTitle icon={ClipboardList} title="Pedidos" sub="Registro y seguimiento de solicitudes" accion={<BotonRefrescar onClick={cargar} />} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['Todos', 'pendiente', 'aprobado', 'entregado', 'rechazado'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid ' + (filtro === f ? AZUL : '#ddd'), background: filtro === f ? AZUL : '#fff', color: filtro === f ? '#fff' : '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{f}</button>))}
      </div>
      {loading ? <Cargando /> : lista.length === 0 ? <Card><Empty texto="No hay pedidos en este estado" /></Card>
        : lista.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 13, padding: 20, marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 19, fontWeight: 800, color: AZUL }}>Pedido #{p.numero}</span><EstadoBadge estado={p.estado} /></div>
                <div style={{ fontSize: 12.5, color: '#999', marginTop: 4 }}>{fmt(p.creado_en)}</div>
              </div>
              {puedeBorrar(p) && <button onClick={() => setConfirmDel(p)} style={{ background: '#fff', border: '1.5px solid #ffcdd2', color: '#c62828', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600 }}><Trash2 size={15} /> Eliminar</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14, fontSize: 13 }}>
              <Info icon={User} label="Solicitante" value={p.solicitante} />
              <Info icon={FileText} label="Presupuesto" value={p.presupuesto || '—'} />
              <Info icon={Building2} label="Obra" value={p.obra || '—'} />
              <Info icon={User} label="Cliente" value={p.cliente || '—'} />
            </div>
            <div style={{ background: '#F8F9FC', borderRadius: 9, padding: '10px 14px', marginBottom: 14 }}>
              {(p.pedido_items || []).map((it, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}><span>{it.nombre} <span style={{ color: '#aaa' }}>· {it.deposito}</span></span><b>x{it.cantidad}</b></div>))}
            </div>
            {rol === 'dueno' && p.estado === 'pendiente' && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => aprobar(p.id)} style={{ ...btnPri, background: '#2e7d32' }}><CheckCircle2 size={16} /> Aprobar</button>
              <button onClick={() => rechazar(p.id)} style={{ ...btnSec, color: '#c62828', borderColor: '#c62828' }}><XCircle size={16} /> Rechazar</button></div>}
            {rol === 'deposito' && p.estado === 'aprobado' && <button onClick={() => entregar(p)} style={{ ...btnPri, background: '#00897b' }}><ArrowUpFromLine size={16} /> Marcar entregado (descuenta stock)</button>}
            {rol === 'deposito' && p.estado === 'pendiente' && <div style={{ fontSize: 13, color: '#f57c00', fontWeight: 600 }}>⏳ Esperando aprobación del dueño para poder entregar</div>}
          </div>))}
      {confirmDel && <ModalShell onClose={() => setConfirmDel(null)}>
        <h3 style={{ margin: '0 0 8px', color: '#c62828' }}>Eliminar pedido #{confirmDel.numero}</h3>
        <p style={{ fontSize: 14, color: '#555', margin: '0 0 18px' }}>Esta acción no se puede deshacer. ¿Seguro?</p>
        <div style={{ display: 'flex', gap: 10 }}><button onClick={() => setConfirmDel(null)} style={{ ...btnSec, flex: 1 }}>Cancelar</button><button onClick={() => eliminar(confirmDel.id)} style={{ ...btnPri, flex: 1, background: '#c62828' }}><Trash2 size={16} /> Sí, eliminar</button></div>
      </ModalShell>}
    </div>
  );
}


// ========================= VEHÍCULOS =========================
function Vehiculos({ rol, usuario }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const puedeEditar = rol === 'deposito' || rol === 'dueno';

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('vehiculos').select('*').order('patente');
    setVehiculos(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const crear = async (v) => {
    await supabase.from('vehiculos').insert({ patente: v.patente, marca: v.marca, modelo: v.modelo, anio: v.anio || null, km_actual: v.km_actual, km_ultimo_service: v.km_ultimo_service, km_cada_service: v.km_cada_service, asignado_a: v.asignado_a, notas: v.notas });
    setModal(null); cargar();
  };
  const editar = async (id, v) => {
    await supabase.from('vehiculos').update({ patente: v.patente, marca: v.marca, modelo: v.modelo, anio: v.anio || null, km_actual: v.km_actual, km_ultimo_service: v.km_ultimo_service, km_cada_service: v.km_cada_service, asignado_a: v.asignado_a, notas: v.notas }).eq('id', id);
    setModal(null); cargar();
  };
  const eliminar = async (id) => { await supabase.from('vehiculos').delete().eq('id', id); setModal(null); cargar(); };

  // Estado del service: km que faltan para el próximo
  const estadoService = (v) => {
    const proximo = (v.km_ultimo_service || 0) + (v.km_cada_service || 10000);
    const faltan = proximo - v.km_actual;
    if (faltan <= 0) return { txt: 'Service vencido', col: '#c62828', bg: '#ffebee', faltan, proximo };
    if (faltan <= 1000) return { txt: `Service próximo (${faltan} km)`, col: '#e65100', bg: '#fff3e0', faltan, proximo };
    return { txt: `Faltan ${faltan} km`, col: '#2e7d32', bg: '#e8f5e9', faltan, proximo };
  };

  const vencidos = vehiculos.filter(v => estadoService(v).faltan <= 0).length;
  const proximos = vehiculos.filter(v => { const f = estadoService(v).faltan; return f > 0 && f <= 1000; }).length;

  return (
    <div>
      <SectionTitle icon={Truck} title="Vehículos" sub="Control de kilometraje, services y reparaciones" accion={puedeEditar ? <button onClick={() => setModal({ tipo: 'nuevo' })} style={{ ...btnPri, padding: '8px 14px' }}><Plus size={16} /> Agregar vehículo</button> : <BotonRefrescar onClick={cargar} />} />

      {(vencidos > 0 || proximos > 0) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          {vencidos > 0 && <div style={{ flex: 1, minWidth: 200, background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 11, padding: '12px 16px', fontSize: 13.5, color: '#c62828', display: 'flex', alignItems: 'center', gap: 9 }}><AlertTriangle size={20} /> <b>{vencidos}</b> vehículo(s) con service VENCIDO</div>}
          {proximos > 0 && <div style={{ flex: 1, minWidth: 200, background: '#fff3e0', border: '1px solid #ffe082', borderRadius: 11, padding: '12px 16px', fontSize: 13.5, color: '#e65100', display: 'flex', alignItems: 'center', gap: 9 }}><Clock size={20} /> <b>{proximos}</b> vehículo(s) con service próximo</div>}
        </div>
      )}

      {loading ? <Cargando /> : vehiculos.length === 0 ? <Card><Empty texto="No hay vehículos cargados todavía" /></Card> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
          {vehiculos.map(v => {
            const es = estadoService(v);
            return (
              <div key={v.id} style={{ background: '#fff', borderRadius: 13, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,.05)', borderTop: `4px solid ${es.col}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', letterSpacing: '.5px' }}>{v.patente}</div>
                    <div style={{ fontSize: 13, color: '#888' }}>{v.marca} {v.modelo}{v.anio ? ` · ${v.anio}` : ''}</div>
                  </div>
                  <Truck size={26} color={AZUL} />
                </div>
                {v.asignado_a && <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}><User size={12} style={{ verticalAlign: -2 }} /> {v.asignado_a}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 22, fontWeight: 800, color: AZUL, margin: '6px 0' }}>
                  <Gauge size={20} /> {v.km_actual.toLocaleString('es-AR')} <span style={{ fontSize: 13, color: '#999', fontWeight: 600 }}>km</span>
                </div>
                <div style={{ background: es.bg, color: es.col, borderRadius: 8, padding: '7px 11px', fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>{es.txt}</div>
                <div style={{ fontSize: 11.5, color: '#999', marginBottom: 12 }}>Último service: {(v.km_ultimo_service || 0).toLocaleString('es-AR')} km · cada {(v.km_cada_service || 0).toLocaleString('es-AR')} km</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setDetalle(v)} style={{ ...btnSec, flex: 1, justifyContent: 'center', padding: '8px' }}><FileText size={14} /> Historial</button>
                  {puedeEditar && <button onClick={() => setModal({ tipo: 'editar', vehiculo: v })} style={{ ...btnMini, background: '#607d8b', padding: '8px 12px' }}><Edit3 size={14} /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal?.tipo === 'nuevo' && <ModalVehiculo onClose={() => setModal(null)} onConfirm={crear} />}
      {modal?.tipo === 'editar' && <ModalVehiculo vehiculo={modal.vehiculo} onClose={() => setModal(null)} onConfirm={(v) => editar(modal.vehiculo.id, v)} onEliminar={() => eliminar(modal.vehiculo.id)} />}
      {detalle && <ModalHistorialVehiculo vehiculo={detalle} puedeEditar={puedeEditar} usuario={usuario} onClose={() => setDetalle(null)} onActualizar={cargar} />}
    </div>
  );
}

function ModalVehiculo({ vehiculo, onClose, onConfirm, onEliminar }) {
  const [f, setF] = useState(vehiculo ? { ...vehiculo } : { patente: '', marca: '', modelo: '', anio: '', km_actual: 0, km_ultimo_service: 0, km_cada_service: 10000, asignado_a: '', notas: '' });
  const set = (k, v) => setF({ ...f, [k]: v });
  return (
    <ModalShell onClose={onClose}>
      <h3 style={{ margin: '0 0 16px', color: AZUL }}>{vehiculo ? 'Editar vehículo' : 'Agregar vehículo'}</h3>
      <Field label="Patente *"><input value={f.patente} onChange={e => set('patente', e.target.value.toUpperCase())} placeholder="ej: AB123CD" style={inp} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Marca"><input value={f.marca} onChange={e => set('marca', e.target.value)} placeholder="ej: Toyota" style={inp} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Modelo"><input value={f.modelo} onChange={e => set('modelo', e.target.value)} placeholder="ej: Hilux" style={inp} /></Field></div>
        <div style={{ width: 80 }}><Field label="Año"><input type="number" value={f.anio} onChange={e => set('anio', parseInt(e.target.value) || '')} style={inp} /></Field></div>
      </div>
      <Field label="Asignado a (técnico / sector)"><input value={f.asignado_a} onChange={e => set('asignado_a', e.target.value)} placeholder="opcional" style={inp} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Km actual"><input type="number" value={f.km_actual} onChange={e => set('km_actual', parseInt(e.target.value) || 0)} style={inp} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Km último service"><input type="number" value={f.km_ultimo_service} onChange={e => set('km_ultimo_service', parseInt(e.target.value) || 0)} style={inp} /></Field></div>
      </div>
      <Field label="Service cada (km)"><input type="number" value={f.km_cada_service} onChange={e => set('km_cada_service', parseInt(e.target.value) || 10000)} style={inp} /></Field>
      <Field label="Notas"><input value={f.notas} onChange={e => set('notas', e.target.value)} placeholder="opcional" style={inp} /></Field>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onClose} style={{ ...btnSec, flex: 1 }}>Cancelar</button>
        <button onClick={() => f.patente && onConfirm(f)} style={{ ...btnPri, flex: 1 }}>{vehiculo ? 'Guardar' : 'Agregar'}</button>
      </div>
      {vehiculo && onEliminar && <button onClick={onEliminar} style={{ width: '100%', marginTop: 10, padding: 9, background: '#fff', border: '1.5px solid #ffcdd2', color: '#c62828', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Trash2 size={14} style={{ verticalAlign: -2 }} /> Eliminar vehículo</button>}
    </ModalShell>
  );
}

function ModalHistorialVehiculo({ vehiculo, puedeEditar, usuario, onClose, onActualizar }) {
  const [reparaciones, setReparaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agregando, setAgregando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('reparaciones').select('*').eq('vehiculo_id', vehiculo.id).order('fecha', { ascending: false });
    setReparaciones(data || []);
    setLoading(false);
  }, [vehiculo.id]);
  useEffect(() => { cargar(); }, [cargar]);

  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-AR');
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,30,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 15, padding: 26, width: 620, maxWidth: '100%', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h3 style={{ margin: 0, color: AZUL, fontSize: 19 }}>{vehiculo.patente} — Historial</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><XCircle size={22} /></button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>{vehiculo.marca} {vehiculo.modelo} · {vehiculo.km_actual.toLocaleString('es-AR')} km</p>

        {puedeEditar && !agregando && <button onClick={() => setAgregando(true)} style={{ ...btnPri, marginBottom: 16 }}><Plus size={16} /> Registrar service / reparación</button>}
        {agregando && <FormReparacion vehiculo={vehiculo} usuario={usuario} onCancel={() => setAgregando(false)} onGuardadoOk={() => { setAgregando(false); cargar(); onActualizar(); }} />}

        {loading ? <Cargando /> : reparaciones.length === 0 ? <Empty texto="Sin registros todavía" /> : (
          <div style={{ marginTop: 8 }}>
            {reparaciones.map(r => (
              <div key={r.id} style={{ borderLeft: `3px solid ${r.tipo === 'service' ? '#0EA5E9' : '#F59E0B'}`, background: '#F8F9FC', borderRadius: 8, padding: '11px 14px', marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: r.tipo === 'service' ? '#0277bd' : '#e65100' }}>{r.tipo === 'service' ? '🔧 Service' : '🛠️ Reparación'}</span>
                  <span style={{ fontSize: 12, color: '#999' }}><Calendar size={11} style={{ verticalAlign: -1 }} /> {fmt(r.fecha)}{r.km ? ` · ${r.km.toLocaleString('es-AR')} km` : ''}</span>
                </div>
                <div style={{ fontSize: 13.5, color: '#333' }}>{r.descripcion}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>{r.taller ? `Taller: ${r.taller}` : ''}{r.costo ? ` · $${Number(r.costo).toLocaleString('es-AR')}` : ''}{r.usuario ? ` · ${r.usuario}` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FormReparacion({ vehiculo, usuario, onCancel, onGuardadoOk }) {
  const [f, setF] = useState({ tipo: 'service', fecha: new Date().toISOString().slice(0, 10), km: vehiculo.km_actual, descripcion: '', costo: '', taller: '' });
  const set = (k, v) => setF({ ...f, [k]: v });
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!f.descripcion) return;
    setGuardando(true);
    await supabase.from('reparaciones').insert({ vehiculo_id: vehiculo.id, tipo: f.tipo, fecha: f.fecha, km: f.km || null, descripcion: f.descripcion, costo: f.costo || null, taller: f.taller, usuario: usuario.nombre });
    // si es service, actualizar km_ultimo_service y km_actual del vehículo
    const upd = { km_actual: Math.max(vehiculo.km_actual, f.km || 0) };
    if (f.tipo === 'service') upd.km_ultimo_service = f.km || vehiculo.km_actual;
    await supabase.from('vehiculos').update(upd).eq('id', vehiculo.id);
    setGuardando(false);
    onGuardadoOk();
  };

  return (
    <div style={{ background: '#F4F6FB', borderRadius: 11, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button onClick={() => set('tipo', 'service')} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1.5px solid ' + (f.tipo === 'service' ? '#0EA5E9' : '#ddd'), background: f.tipo === 'service' ? '#0EA5E9' : '#fff', color: f.tipo === 'service' ? '#fff' : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🔧 Service</button>
        <button onClick={() => set('tipo', 'reparacion')} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1.5px solid ' + (f.tipo === 'reparacion' ? '#F59E0B' : '#ddd'), background: f.tipo === 'reparacion' ? '#F59E0B' : '#fff', color: f.tipo === 'reparacion' ? '#fff' : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🛠️ Reparación</button>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Fecha"><input type="date" value={f.fecha} onChange={e => set('fecha', e.target.value)} style={inp} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Km"><input type="number" value={f.km} onChange={e => set('km', parseInt(e.target.value) || 0)} style={inp} /></Field></div>
      </div>
      <Field label="Descripción *"><input value={f.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="ej: Cambio de aceite y filtros" style={inp} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Taller"><input value={f.taller} onChange={e => set('taller', e.target.value)} placeholder="opcional" style={inp} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Costo ($)"><input type="number" value={f.costo} onChange={e => set('costo', e.target.value)} placeholder="opcional" style={inp} /></Field></div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button onClick={onCancel} style={{ ...btnSec, flex: 1 }}>Cancelar</button>
        <button onClick={guardar} disabled={guardando} style={{ ...btnPri, flex: 1, opacity: guardando ? .6 : 1 }}>{guardando ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div>
  );
}


// ========================= AUXILIARES =========================
function SectionTitle({ icon: Icon, title, sub, accion }) {
  return (
    <div className="fadein" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(135deg, ${AZUL}, ${CIELO})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,222,0.25)' }}><Icon size={24} color="#fff" strokeWidth={2.2} /></div>
        <div><h1 style={{ margin: 0, fontSize: 25, color: TINTA, fontWeight: 800, letterSpacing: '-0.5px' }}>{title}</h1>{sub && <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: 13.5, fontWeight: 500 }}>{sub}</p>}</div>
      </div>
      {accion}
    </div>
  );
}
function BotonRefrescar({ onClick }) { return <button onClick={onClick} style={{ ...btnSec, padding: '8px 14px' }}><RefreshCw size={15} /> Actualizar</button>; }
function Card({ title, children }) { return <div style={{ background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)' }}>{title && <h3 style={{ margin: '0 0 16px', fontSize: 15.5, color: TINTA, fontWeight: 700 }}>{title}</h3>}{children}</div>; }
function Empty({ texto }) { return <div style={{ textAlign: 'center', padding: '36px 20px', color: '#cbd5e1', fontSize: 14 }}><div style={{ width: 56, height: 56, margin: '0 auto 12px', borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={28} color="#cbd5e1" /></div><div style={{ color: '#94a3b8' }}>{texto}</div></div>; }
function Cargando() { return <div style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}><RefreshCw size={28} color={AZUL} style={{ animation: 'spin 1s linear infinite' }} /><div style={{ marginTop: 10, fontSize: 14 }}>Cargando...</div><style>{'@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}'}</style></div>; }
function Select({ value, onChange, options }) { return <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, background: '#fff', cursor: 'pointer', outline: 'none', color: TINTA, fontWeight: 500 }}>{options.map(o => <option key={o}>{o}</option>)}</select>; }
function Field({ label, children }) { return <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{label}</label>{children}</div>; }
function Info({ icon: Icon, label, value }) { return <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '9px 12px', border: '1px solid #f1f5f9' }}><div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}><Icon size={12} /> {label}</div><div style={{ fontSize: 13.5, fontWeight: 700, color: TINTA, marginTop: 2 }}>{value}</div></div>; }
function EstadoBadge({ estado }) { const map = { pendiente: ['#FEF3E2', '#D97706', 'Pendiente'], aprobado: ['#E7F8EF', '#059669', 'Aprobado'], entregado: ['#E6F3FE', '#0284C7', 'Entregado'], rechazado: ['#FEECEC', '#DC2626', 'Rechazado'] }; const [bg, col, txt] = map[estado] || map.pendiente; return <span style={{ background: bg, color: col, fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>{txt}</span>; }
function DepBadge({ dep }) { const col = dep === 'Caseros' ? AZUL : '#0D9488'; return <span style={{ background: col + '12', color: col, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 7 }}>{dep}</span>; }
function ModalShell({ children, onClose }) { return <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(7,11,52,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}><div onClick={e => e.stopPropagation()} className="fadein" style={{ background: '#fff', borderRadius: 18, padding: 28, width: 430, maxWidth: '100%', boxShadow: '0 30px 80px rgba(7,11,52,0.4)' }}>{children}</div></div>; }
function gasColor(g) { const m = { r410a: '#0284C7', r134a: '#7C3AED', r22: '#EA580C', r32: '#059669' }; return m[(g || '').toLowerCase()] || '#0284C7'; }

const th = { padding: '14px 16px', fontSize: 11.5, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase' };
const td = { padding: '12px 16px', verticalAlign: 'middle' };
const thb = { padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px' };
const tdb = { padding: '9px 10px', color: '#475569' };
const inp = { width: '100%', padding: '10px 13px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', outline: 'none', color: TINTA };
const btnPri = { display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: AZUL, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Sora', sans-serif", cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,222,0.25)' };
const btnSec = { display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const btnMini = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 11px', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const qtyBtn = { width: 38, height: 38, borderRadius: 8, border: '1.5px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const qtyBtnSm = { width: 28, height: 28, borderRadius: 7, border: '1.5px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
