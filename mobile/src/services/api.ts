import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Alerta, Categoria, Emprendimiento, NuevoMovimiento, Usuario } from '../types/db';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const SESSION_KEY = 'savemoney.session.v1';
type Session = { accessToken: string; refreshToken: string; expiresAt: number; user: Usuario };
type ApiEnvelope<T> = { success: true; data: T } | { success: false; error?: { message?: string; details?: unknown } };
let sessionCache: Session | null | undefined;
let refreshInFlight: Promise<Session> | null = null;
const listeners = new Set<(session: Session | null) => void>();

async function session(): Promise<Session | null> {
  if (sessionCache !== undefined) return sessionCache;
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  try { sessionCache = raw ? JSON.parse(raw) as Session : null; }
  catch { sessionCache = null; await AsyncStorage.removeItem(SESSION_KEY); }
  return sessionCache;
}

async function setSession(value: Session | null) {
  sessionCache = value;
  if (value) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(value));
  else await AsyncStorage.removeItem(SESSION_KEY);
  listeners.forEach((listener) => listener(value));
}

async function renewSession(current: Session): Promise<Session> {
  const latest = await session();
  if (latest && latest.accessToken !== current.accessToken) return latest;
  if (!refreshInFlight) {
    refreshInFlight = request<{ accessToken: string; refreshToken: string; expiresIn: number; user: Usuario }>(
      '/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: current.refreshToken }) }, false,
    ).then(async (renewed) => {
      const next = { ...current, ...renewed, expiresAt: Date.now() + renewed.expiresIn * 1000 };
      await setSession(next);
      return next;
    }).finally(() => { refreshInFlight = null; });
  }
  const pending = refreshInFlight;
  if (!pending) throw new Error('No se pudo renovar la sesión.');
  return pending;
}

function apiUrl(path: string) {
  if (!BASE_URL) throw new Error('Configura EXPO_PUBLIC_API_URL con la URL HTTPS de tu backend en mobile/.env.local.');
  if (!BASE_URL.startsWith('https://')) throw new Error('EXPO_PUBLIC_API_URL debe usar HTTPS.');
  return `${BASE_URL}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const current = authenticated ? await session() : null;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (current?.accessToken) headers.set('Authorization', `Bearer ${current.accessToken}`);
  let response: Response;
  try { response = await fetch(apiUrl(path), { ...init, headers }); }
  catch { throw new Error('No se pudo conectar con SaveMoney. Comprueba tu conexión y la URL del servidor.'); }
  if (response.status === 401 && current?.refreshToken && path !== '/auth/refresh') {
    try {
      const next = await renewSession(current);
      headers.set('Authorization', `Bearer ${next.accessToken}`);
      response = await fetch(apiUrl(path), { ...init, headers });
    } catch { await setSession(null); throw new Error('Tu sesión venció. Inicia sesión nuevamente.'); }
  }
  if (response.status === 401 && current) await setSession(null);
  let payload: ApiEnvelope<T> | undefined;
  try { payload = await response.json() as ApiEnvelope<T>; } catch { /* handled below */ }
  if (!response.ok || !payload || !payload.success) {
    const error = payload && !payload.success ? payload.error : undefined;
    throw new Error(error?.message || `Error del servidor (${response.status}).`);
  }
  return payload.data;
}

function query(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined) params.set(key, String(value)); });
  const text = params.toString();
  return text ? `?${text}` : '';
}

async function all<T>(path: string, key: string, params: Record<string, string | number | undefined> = {}): Promise<T[]> {
  const pageSize = 100;
  const first = await request<Record<string, unknown>>(`${path}${query({ ...params, page: 1, limit: pageSize })}`);
  const rows = (first[key] as T[] | undefined) ?? [];
  const pages = (first.paginacion as { totalPaginas?: number } | undefined)?.totalPaginas ?? 1;
  if (pages <= 1) return rows;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) =>
    request<Record<string, unknown>>(`${path}${query({ ...params, page: index + 2, limit: pageSize })}`),
  ));
  return rows.concat(...rest.map((result) => (result[key] as T[] | undefined) ?? []));
}

export const auth = {
  subscribe(listener: (value: Session | null) => void) { listeners.add(listener); return () => listeners.delete(listener); },
  current: session,
  async login(email: string, password: string) {
    const result = await request<{ accessToken: string; refreshToken: string; expiresIn: number; user: Usuario }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false,
    );
    await setSession({ ...result, expiresAt: Date.now() + result.expiresIn * 1000 });
  },
  async register(input: { nombres: string; apellidos: string; email: string; password: string }) {
    const result = await request<{ accessToken: string; refreshToken: string; expiresIn: number; user: Usuario }>(
      '/auth/register', { method: 'POST', body: JSON.stringify({ ...input, codigo_moneda: 'BOB' }) }, false,
    );
    await setSession({ ...result, expiresAt: Date.now() + result.expiresIn * 1000 });
  },
  async logout() {
    const current = await session();
    try { if (current) await request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: current.refreshToken }) }); }
    finally { await setSession(null); }
  },
};

export function fechaLocal(d = new Date()) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
const periodo = (year: number, month: number) => ({ inicio: fechaLocal(new Date(year, month - 1, 1)), fin: fechaLocal(new Date(year, month, 0)), etiqueta: new Date(year, month - 1, 1).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' }) });
const actual = () => periodo(new Date().getFullYear(), new Date().getMonth() + 1);
const number = (value: unknown) => Number(value ?? 0);

type RawMovimiento = { id_movimiento: number | string; id_categoria: number; id_emprendimiento?: number | string | null; monto: number | string; fecha_movimiento: string; fecha_registro?: string | null; descripcion?: string | null; categoria?: { nombre: string; tipo_categoria?: { tipo_movimiento?: { nombre: string } } }; frecuencia?: 'Fijo' | 'Variable' | null; es_impulsivo?: boolean };
type RawCategoria = Categoria & { tipo_categoria?: { tipo_movimiento?: { nombre: string } } };
const palette = ['#3882F6', '#45BE91', '#F6A755', '#9078D0', '#EE7496'];
async function loadMovements(from?: string, to?: string) {
  const rows = await all<RawMovimiento>('/movimientos', 'movimientos', { fecha_desde: from, fecha_hasta: to });
  return rows.map((m) => ({ ...m, id_movimiento: Number(m.id_movimiento), id_categoria: Number(m.id_categoria), id_emprendimiento: m.id_emprendimiento == null ? null : Number(m.id_emprendimiento), monto: number(m.monto) }));
}
async function loadCategories() {
  return (await all<RawCategoria>('/categorias', 'categorias')).map((c) => ({ ...c, tipo: c.tipo_categoria?.tipo_movimiento?.nombre === 'Ingreso' ? 'Ingreso' as const : 'Gasto' as const, icono: c.tipo_categoria?.tipo_movimiento?.nombre === 'Ingreso' ? 'trending-up' : 'tag-outline' }));
}
const sum = <T,>(items: T[], fn: (item: T) => number) => items.reduce((total, item) => total + Math.round(fn(item) * 100), 0) / 100;
function viewMovements(rows: RawMovimiento[], categories: Awaited<ReturnType<typeof loadCategories>>) {
  const byId = new Map(categories.map((c) => [c.id_categoria, c]));
  return rows.map((m) => { const c = byId.get(Number(m.id_categoria)); const income = c?.tipo === 'Ingreso'; return {
    id: Number(m.id_movimiento), id_movimiento: Number(m.id_movimiento), id_categoria: Number(m.id_categoria), id_emprendimiento: m.id_emprendimiento == null ? null : Number(m.id_emprendimiento),
    fecha_movimiento: m.fecha_movimiento.slice(0, 10), fecha_registro: m.fecha_registro ?? '', monto: (income ? 1 : -1) * number(m.monto), tipo: income ? 'Ingreso' as const : 'Gasto' as const,
    titulo: m.descripcion || c?.nombre || 'Movimiento', categoria: c?.nombre ?? 'Sin categoría', detalle: [c?.nombre, m.fecha_movimiento.slice(0, 10)].filter(Boolean).join(' · '), icono: c?.icono ?? 'wallet-outline', frecuencia: m.frecuencia ?? 'Variable', es_impulsivo: Boolean(m.es_impulsivo),
  }; });
}
function group(rows: ReturnType<typeof viewMovements>) {
  const values = new Map<string, { monto: number; compras: number }>();
  rows.forEach((r) => { const item = values.get(r.categoria) ?? { monto: 0, compras: 0 }; item.monto += Math.round(Math.abs(r.monto) * 100); item.compras++; values.set(r.categoria, item); });
  const total = [...values.values()].reduce((sum, item) => sum + item.monto, 0);
  return [...values.entries()].sort((a, b) => b[1].monto - a[1].monto).map(([nombre, item], i) => ({ nombre, icono: rows.find((r) => r.categoria === nombre)?.icono ?? 'tag-outline', monto: item.monto / 100, compras: item.compras, pct: total ? Math.round(item.monto * 100 / total) : 0, color: palette[i % palette.length] }));
}

export const api = {
  getPerfil: async () => { const user = await request<Usuario>('/me'); return { ...user, id_usuario: Number(user.id_usuario) }; },
  getCategorias: loadCategories,
  getMetodos: async () => { const data = await request<{ metodos_pago: { id_metodo_pago: number; nombre: string }[] }>('/catalogos'); return data.metodos_pago; },
  getEmprendimientos: async () => all<Emprendimiento>('/emprendimientos', 'emprendimientos', { activo: 'true' }),
  createMovimiento: async (m: NuevoMovimiento) => {
    if (!Number.isFinite(m.monto) || m.monto <= 0 || !m.id_categoria || !m.id_metodo_pago) throw new Error('Completa un monto, una categoría y un método de pago válidos.');
    if (m.ambito === 'Negocio' && !m.id_emprendimiento) throw new Error('Selecciona un emprendimiento.');
    return request('/movimientos', { method: 'POST', body: JSON.stringify({ id_categoria: m.id_categoria, id_metodo_pago: m.id_metodo_pago, id_emprendimiento: m.ambito === 'Negocio' ? m.id_emprendimiento : undefined, monto: m.monto, fecha_movimiento: m.fecha, descripcion: m.nota?.trim() || undefined, frecuencia: m.frecuencia, es_impulsivo: m.tipo === 'Gasto' && Boolean(m.impulsivo) }) });
  },
  async getDashboard() {
    const p = actual();
    const [perfil, cats, rows, budgets, goals] = await Promise.all([
      api.getPerfil(), loadCategories(), loadMovements(p.inicio, p.fin),
      all<any>('/presupuestos', 'presupuestos', { anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 }),
      all<any>('/metas-ahorro', 'metas'),
    ]);
    const contributions = (await Promise.all(goals.map((g) => all<any>(`/metas-ahorro/${g.id_meta}/aportes`, 'aportes')))).flat();
    const views = viewMovements(rows, cats); const incomes = sum(views.filter((m) => m.tipo === 'Ingreso'), (m) => m.monto); const expenses = sum(views.filter((m) => m.tipo === 'Gasto'), (m) => -m.monto); const savings = sum(contributions.filter((a) => String(a.fecha_aporte).slice(0, 7) === p.inicio.slice(0, 7)), (a) => number(a.monto));
    return { nombre: perfil.nombres, moneda: perfil.codigo_moneda, disponible: incomes - expenses - savings, ingresos: incomes, gastos: expenses, ahorro: savings, limiteMensual: sum(budgets, (b) => number(b.monto_total)), distribucion: group(views.filter((m) => m.tipo === 'Gasto')), recientes: views.slice(0, 8) };
  },
  async getNegocio(ambito: 'Todos' | 'Personal' | 'Negocio' = 'Todos') { const p = actual(); const [cats, rows, businesses] = await Promise.all([loadCategories(), loadMovements(p.inicio, p.fin), api.getEmprendimientos()]); const views = viewMovements(rows, cats); const expense = views.filter((m) => m.tipo === 'Gasto'); const filtered = views.filter((m) => ambito === 'Todos' || (ambito === 'Negocio') === (m.id_emprendimiento != null)); return { personal: sum(expense.filter((m) => !m.id_emprendimiento), (m) => -m.monto), negocio: sum(expense.filter((m) => m.id_emprendimiento), (m) => -m.monto), nombreNegocio: businesses.map((b) => b.nombre).join(', ') || 'Sin emprendimientos', fijos: sum(filtered.filter((m) => m.tipo === 'Gasto' && m.frecuencia === 'Fijo'), (m) => -m.monto), variables: sum(filtered.filter((m) => m.tipo === 'Gasto' && m.frecuencia !== 'Fijo'), (m) => -m.monto), negocios: businesses.map((b) => ({ id: Number(b.id_emprendimiento), nombre: b.nombre, categoria: b.descripcion ?? '', limite: 0 })), movimientos: filtered }; },
  async getPresupuesto(year = new Date().getFullYear(), month = new Date().getMonth() + 1) { const p = periodo(year, month); const [plans, cats, rows] = await Promise.all([all<any>('/presupuestos', 'presupuestos', { anio: year, mes: month }), loadCategories(), loadMovements(p.inicio, p.fin)]); const plan = plans.find((item) => !item.id_emprendimiento); const limits = plan ? await all<any>(`/presupuestos/${plan.id_presupuesto}/categorias`, 'registros') : []; const views = viewMovements(rows, cats).filter((m) => m.tipo === 'Gasto' && !m.id_emprendimiento); return { mesLabel: p.etiqueta, total: number(plan?.monto_total), gastado: sum(views, (m) => -m.monto), categorias: limits.map((l) => { const cat = cats.find((c) => c.id_categoria === Number(l.id_categoria)); return { id_categoria: Number(l.id_categoria), nombre: cat?.nombre ?? 'Categoría', icono: cat?.icono ?? 'tag-outline', gastado: sum(views.filter((m) => m.id_categoria === Number(l.id_categoria)), (m) => -m.monto), limite: number(l.monto_limite) }; }), umbrales: plan ? [{ pct: number(plan.umbral_alerta_pct), activo: true }] : [] }; },
  async getMetas() { const metas = await all<any>('/metas-ahorro', 'metas'); const contributions = (await Promise.all(metas.map((m) => all<any>(`/metas-ahorro/${m.id_meta}/aportes`, 'aportes')))).flat(); const p = actual(); const byGoal = (id: number) => contributions.filter((a) => Number(a.id_meta) === Number(id)); const history = await Promise.all([-3, -2, -1, 0].map(async (offset) => { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() + offset); const month = fechaLocal(date).slice(0, 7); const total = sum(contributions.filter((a) => String(a.fecha_aporte).slice(0, 7) === month), (a) => number(a.monto)); return { label: date.toLocaleDateString('es-BO', { month: 'short' }), etiqueta: date.toLocaleDateString('es-BO', { month: 'short' }), valor: total }; })); return { totalAcumulado: sum(contributions, (a) => number(a.monto)), objetivoGlobal: sum(metas, (m) => number(m.monto_objetivo)), rendimientoMensual: sum(contributions.filter((a) => String(a.fecha_aporte).slice(0, 7) === p.inicio.slice(0, 7)), (a) => number(a.monto)), metas: metas.map((m) => ({ id_meta: Number(m.id_meta), nombre: m.nombre, icono: 'target', objetivo: number(m.monto_objetivo), ahorrado: sum(byGoal(m.id_meta), (a) => number(a.monto)), sugerencia: m.descripcion ?? '', recordatorio: `Fecha límite: ${String(m.fecha_limite).slice(0, 10)}`, recordatorioActivo: false })), proyeccion: history, racha: 0 }; },
  async getImpulsivas() { const p = actual(); const prevDate = new Date(); prevDate.setMonth(prevDate.getMonth() - 1); const prev = periodo(prevDate.getFullYear(), prevDate.getMonth() + 1); const [cats, rows, purchases] = await Promise.all([loadCategories(), loadMovements(prev.inicio, p.fin), all<any>('/compras-impulsivas', 'compras')]); const linked = new Set(purchases.map((item) => Number(item.id_movimiento)).filter(Number.isFinite)); const allViews = viewMovements(rows, cats); const impulses = allViews.filter((m) => m.tipo === 'Gasto' && (m.es_impulsivo || linked.has(m.id_movimiento))); const thisMonth = impulses.filter((m) => m.fecha_movimiento >= p.inicio); const lastMonth = impulses.filter((m) => m.fecha_movimiento >= prev.inicio && m.fecha_movimiento < p.inicio); const total = sum(thisMonth, (m) => -m.monto); const prior = sum(lastMonth, (m) => -m.monto); const costs = sum(allViews.filter((m) => m.tipo === 'Gasto' && m.fecha_movimiento >= p.inicio), (m) => -m.monto); const dateLabel = new Date().toLocaleDateString('es-BO', { month: 'long', year: 'numeric' }); const dayAgo = Date.now() - 86400000; const compras24h = thisMonth.filter((m) => m.fecha_registro && Date.parse(m.fecha_registro) >= dayAgo).length; return { mes: dateLabel, total, compras: thisMonth.length, impactoPct: costs ? Math.round(total * 100 / costs) : 0, variacionPct: prior ? Math.round((total - prior) * 100 / prior) : 0, limite: 0, diasRestantes: 0, categorias: group(thisMonth), compras24h }; },
  async getResumen() { const p = actual(); const d = new Date(); d.setMonth(d.getMonth() - 1); const prev = periodo(d.getFullYear(), d.getMonth() + 1); const [cats, rows, goals] = await Promise.all([loadCategories(), loadMovements(prev.inicio, p.fin), all<any>('/metas-ahorro', 'metas')]); const contributions = (await Promise.all(goals.map((g) => all<any>(`/metas-ahorro/${g.id_meta}/aportes`, 'aportes')))).flat(); const views = viewMovements(rows, cats); const curr = views.filter((m) => m.fecha_movimiento >= p.inicio); const old = views.filter((m) => m.fecha_movimiento >= prev.inicio && m.fecha_movimiento < p.inicio); const save = (month: string) => sum(contributions.filter((a) => String(a.fecha_aporte).slice(0, 7) === month), (a) => number(a.monto)); const totals = (list: typeof curr) => ({ ingresos: sum(list.filter((m) => m.tipo === 'Ingreso'), (m) => m.monto), gastos: sum(list.filter((m) => m.tipo === 'Gasto'), (m) => -m.monto) }); const c = totals(curr); const o = totals(old); const pct = (now: number, before: number) => before ? Math.round((now - before) * 100 / before) : 0; const variable = group(curr.filter((m) => m.tipo === 'Gasto' && m.frecuencia !== 'Fijo')); return { ingresos: { valor: c.ingresos, var: pct(c.ingresos, o.ingresos) }, gastos: { valor: c.gastos, var: pct(c.gastos, o.gastos) }, ahorro: { valor: save(p.inicio.slice(0, 7)), var: pct(save(p.inicio.slice(0, 7)), save(prev.inicio.slice(0, 7))) }, anterior: { ingresos: o.ingresos, gastos: o.gastos, ahorro: save(prev.inicio.slice(0, 7)) }, balanceNeto: c.ingresos - c.gastos - save(p.inicio.slice(0, 7)), fijos: sum(curr.filter((m) => m.tipo === 'Gasto' && m.frecuencia === 'Fijo'), (m) => -m.monto), variables: sum(curr.filter((m) => m.tipo === 'Gasto' && m.frecuencia !== 'Fijo'), (m) => -m.monto), mayorVariable: variable[0] ?? { nombre: 'Sin gastos variables', monto: 0, pct: 0 }, categorias: group(curr.filter((m) => m.tipo === 'Gasto') ) }; },
  getAlertas: () => all<Alerta>('/alertas', 'alertas'),
  marcarAlerta: (id: number) => request(`/alertas/${id}/leer`, { method: 'PATCH' }),
};
