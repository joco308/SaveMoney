import type {
  Alerta, Ambito, AporteMeta, Categoria, CompraImpulsiva, Emprendimiento, MetaAhorro,
  Movimiento, MovimientoVista, NuevoMovimiento, Presupuesto, PresupuestoCategoria, Usuario,
} from '../types/db';
import { getSupabase } from './supabase';

type Perfil = Pick<Usuario, 'id_usuario' | 'nombres' | 'apellidos' | 'codigo_moneda'>;
type TipoCategoria = { id_tipo_categoria: number; id_tipo_movimiento: number };
type TipoMovimiento = { id_tipo_movimiento: number; nombre: string };
type Pago = { id_metodo_pago: number; nombre: string };
type MovimientoReal = Movimiento & { frecuencia: 'Fijo' | 'Variable' | null; es_impulsivo: boolean };

export function fechaLocal(d = new Date()) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function periodo(anio: number, mes: number) {
  const fecha = new Date(anio, mes - 1, 1);
  return {
    inicio: fechaLocal(fecha),
    fin: fechaLocal(new Date(anio, mes, 1)),
    etiqueta: fecha.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' }),
  };
}

function mesActual(offset = 0) {
  const d = new Date();
  return periodo(d.getFullYear(), d.getMonth() + 1 + offset);
}

function dentro(fecha: string, p: ReturnType<typeof periodo>) {
  return fecha >= p.inicio && fecha < p.fin;
}

async function filas<T>(consulta: (inicio: number, fin: number) => PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>) {
  const resultado: T[] = [];
  const pagina = 500;
  for (let inicio = 0; ; inicio += pagina) {
    const { data, error } = await consulta(inicio, inicio + pagina - 1);
    if (error) throw new Error(error.message);
    resultado.push(...(data ?? []));
    if ((data?.length ?? 0) < pagina) return resultado;
  }
}

export async function perfilActual(): Promise<Perfil> {
  const db = getSupabase();
  const leer = () => db.from('usuario').select('id_usuario,nombres,apellidos,codigo_moneda').maybeSingle<Perfil>();
  const perfil = await leer();
  if (perfil.error) throw new Error(perfil.error.message);
  if (perfil.data) return perfil.data;

  const { error } = await db.rpc('mobile_crear_perfil');
  if (error) throw new Error(error.message);
  const nuevo = await leer();
  if (nuevo.error) throw new Error(nuevo.error.message);
  if (!nuevo.data) throw new Error('Tu perfil de SaveMoney no está activo.');
  return nuevo.data;
}

async function categorias() {
  const db = getSupabase();
  const [lista, tipos, movimientos] = await Promise.all([
    filas<Categoria>((a, b) => db.from('categoria').select('*').order('id_categoria').range(a, b)),
    filas<TipoCategoria>((a, b) => db.from('tipo_categoria').select('id_tipo_categoria,id_tipo_movimiento').order('id_tipo_categoria').range(a, b)),
    filas<TipoMovimiento>((a, b) => db.from('tipo_movimiento').select('id_tipo_movimiento,nombre').order('id_tipo_movimiento').range(a, b)),
  ]);
  const nombres = new Map(movimientos.map((tipo) => [tipo.id_tipo_movimiento, tipo.nombre]));
  const tipoPorId = new Map(tipos.map((tipo) => [tipo.id_tipo_categoria, nombres.get(tipo.id_tipo_movimiento)]));
  return lista.map((c) => ({
    ...c,
    tipo: tipoPorId.get(c.id_tipo_categoria) === 'Ingreso' ? 'Ingreso' as const : 'Gasto' as const,
    icono: tipoPorId.get(c.id_tipo_categoria) === 'Ingreso' ? 'trending-up' : 'tag-outline',
  }));
}

function pagos() {
  const db = getSupabase();
  return filas<Pago>((a, b) => db.from('metodo_pago').select('id_metodo_pago,nombre').order('id_metodo_pago').range(a, b));
}

function negocios() {
  const db = getSupabase();
  return filas<Emprendimiento>((a, b) => db.from('emprendimiento').select('*').order('id_emprendimiento').range(a, b));
}

function movimientos(inicio: string, fin: string) {
  const db = getSupabase();
  return filas<MovimientoReal>((a, b) => db.from('movimiento').select('*')
    .gte('fecha_movimiento', inicio).lt('fecha_movimiento', fin)
    .order('fecha_movimiento', { ascending: false }).order('id_movimiento', { ascending: false }).range(a, b));
}

function aportes() {
  const db = getSupabase();
  return filas<AporteMeta>((a, b) => db.from('aporte_meta').select('*').order('id_aporte').range(a, b));
}

function presupuestos(anio: number, mes: number) {
  const db = getSupabase();
  return filas<Presupuesto>((a, b) => db.from('presupuesto').select('*').eq('anio', anio).eq('mes', mes)
    .order('id_presupuesto', { ascending: false }).range(a, b));
}

type CategoriaReal = Awaited<ReturnType<typeof categorias>>[number];

type MovimientoConVista = MovimientoVista & Omit<MovimientoReal, 'monto' | 'frecuencia'>;

function vistas(datos: MovimientoReal[], cats: CategoriaReal[]): MovimientoConVista[] {
  const porId = new Map(cats.map((cat) => [cat.id_categoria, cat]));
  return datos.map((mov) => {
    const cat = porId.get(mov.id_categoria);
    const tipo = cat?.tipo ?? 'Gasto';
    return {
      ...mov,
      id: mov.id_movimiento,
      titulo: mov.descripcion || cat?.nombre || 'Movimiento',
      detalle: [cat?.nombre, mov.fecha_movimiento].filter(Boolean).join(' · '),
      monto: (tipo === 'Ingreso' ? 1 : -1) * Number(mov.monto),
      tipo,
      icono: cat?.icono ?? 'wallet-outline',
      frecuencia: mov.frecuencia ?? undefined,
    };
  });
}

const suma = <T,>(items: T[], monto: (item: T) => number) =>
  items.reduce((centavos, item) => centavos + Math.round(monto(item) * 100), 0) / 100;
const pct = (valor: number, total: number) => total ? Math.round(100 * valor / total) : 0;
const gastos = <T extends MovimientoVista,>(items: T[]) => items.filter((item) => item.tipo === 'Gasto');

const paleta = ['#3882F6', '#45BE91', '#F6A755', '#9078D0', '#EE7496'];

function grupos(items: MovimientoConVista[], cats: CategoriaReal[]) {
  const resumen = new Map<number, { monto: number; compras: number }>();
  for (const item of items) {
    const grupo = resumen.get(item.id_categoria) ?? { monto: 0, compras: 0 };
    grupo.monto += Math.round(Math.abs(item.monto) * 100);
    grupo.compras++;
    resumen.set(item.id_categoria, grupo);
  }
  const total = [...resumen.values()].reduce((n, g) => n + g.monto, 0);
  const porId = new Map(cats.map((c) => [c.id_categoria, c]));
  return [...resumen.entries()].sort(([, a], [, b]) => b.monto - a.monto).map(([id, grupo], i) => ({
    nombre: porId.get(id)?.nombre ?? 'Categoría',
    icono: porId.get(id)?.icono ?? 'tag-outline',
    monto: grupo.monto / 100,
    compras: grupo.compras,
    pct: pct(grupo.monto, total),
    color: paleta[i % paleta.length],
  }));
}

function totales(items: MovimientoVista[]) {
  return {
    ingresos: suma(items.filter((m) => m.tipo === 'Ingreso'), (m) => m.monto),
    gastos: suma(gastos(items), (m) => -m.monto),
  };
}

function porFrecuencia(items: MovimientoVista[]) {
  return {
    fijos: suma(gastos(items).filter((m) => m.frecuencia === 'Fijo'), (m) => -m.monto),
    variables: suma(gastos(items).filter((m) => m.frecuencia === 'Variable'), (m) => -m.monto),
  };
}

export const api = {
  getPerfil: perfilActual,
  getCategorias: categorias,
  getMetodos: pagos,
  getEmprendimientos: async () => (await negocios()).filter((e) => e.activo),
  async getDashboard() {
    const hoy = new Date();
    const actual = mesActual();
    const [perfil, cats, datos, aportesMeta, planes] = await Promise.all([
      perfilActual(), categorias(), movimientos(actual.inicio, actual.fin), aportes(),
      presupuestos(hoy.getFullYear(), hoy.getMonth() + 1),
    ]);
    const recientes = vistas(datos, cats);
    const { ingresos, gastos: gasto } = totales(recientes);
    const ahorro = suma(aportesMeta.filter((a) => dentro(a.fecha_aporte, actual)), (a) => Number(a.monto));
    return {
      nombre: perfil.nombres,
      moneda: perfil.codigo_moneda,
      disponible: ingresos - gasto - ahorro,
      ingresos, gastos: gasto, ahorro,
      limiteMensual: suma(planes, (p) => Number(p.monto_total)),
      distribucion: grupos(recientes.filter((m) => m.tipo === 'Gasto'), cats),
      recientes: recientes.slice(0, 8),
    };
  },
  async getNegocio(ambito: Ambito | 'Todos' = 'Todos') {
    const hoy = new Date();
    const actual = mesActual();
    const [cats, datos, empresas, planes] = await Promise.all([
      categorias(), movimientos(actual.inicio, actual.fin), negocios(), presupuestos(hoy.getFullYear(), hoy.getMonth() + 1),
    ]);
    const lista = vistas(datos, cats);
    const filtro = lista.filter((m) => ambito === 'Todos' || (ambito === 'Negocio') === (m.id_emprendimiento != null));
    const activos = empresas.filter((e) => e.activo);
    return {
      personal: suma(gastos(lista).filter((m) => m.id_emprendimiento == null), (m) => -m.monto),
      negocio: suma(gastos(lista).filter((m) => m.id_emprendimiento != null), (m) => -m.monto),
      nombreNegocio: activos.map((e) => e.nombre).join(', ') || 'Sin emprendimientos',
      ...porFrecuencia(filtro),
      negocios: activos.map((e) => ({
        id: e.id_emprendimiento, nombre: e.nombre, categoria: e.descripcion ?? '',
        limite: suma(planes.filter((p) => p.id_emprendimiento === e.id_emprendimiento), (p) => Number(p.monto_total)),
      })),
      movimientos: filtro,
    };
  },
  async getPresupuesto(anio = new Date().getFullYear(), mes = new Date().getMonth() + 1) {
    const db = getSupabase();
    const actual = periodo(anio, mes);
    const [planes, cats, datos] = await Promise.all([presupuestos(anio, mes), categorias(), movimientos(actual.inicio, actual.fin)]);
    const plan = planes.find((p) => p.id_emprendimiento == null);
    const limites = plan ? await filas<PresupuestoCategoria>((a, b) => db.from('presupuesto_categoria').select('*')
      .eq('id_presupuesto', plan.id_presupuesto).order('id_limite').range(a, b)) : [];
    const egresos = vistas(datos, cats).filter((m) => m.tipo === 'Gasto' && m.id_emprendimiento == null);
    return {
      mesLabel: actual.etiqueta,
      total: Number(plan?.monto_total ?? 0),
      gastado: suma(egresos, (m) => -m.monto),
      categorias: limites.map((limite) => {
        const cat = cats.find((c) => c.id_categoria === limite.id_categoria);
        return {
          id_categoria: limite.id_categoria, nombre: cat?.nombre ?? 'Categoría', icono: cat?.icono ?? 'tag-outline',
          gastado: suma(egresos.filter((m) => m.id_categoria === limite.id_categoria), (m) => -m.monto),
          limite: Number(limite.monto_limite),
        };
      }),
      umbrales: plan ? [{ pct: plan.umbral_alerta_pct, activo: true }] : [],
    };
  },
  async getMetas() {
    const db = getSupabase();
    const [metas, aportesMeta] = await Promise.all([
      filas<MetaAhorro>((a, b) => db.from('meta_ahorro').select('*').order('id_meta').range(a, b)), aportes(),
    ]);
    const fechas = [-3, -2, -1, 0].map(mesActual);
    return {
      totalAcumulado: suma(aportesMeta, (a) => Number(a.monto)),
      objetivoGlobal: suma(metas, (m) => Number(m.monto_objetivo)),
      rendimientoMensual: suma(aportesMeta.filter((a) => dentro(a.fecha_aporte, mesActual())), (a) => Number(a.monto)),
      metas: metas.map((m) => ({
        id_meta: m.id_meta, nombre: m.nombre, icono: 'target',
        objetivo: Number(m.monto_objetivo),
        ahorrado: suma(aportesMeta.filter((a) => a.id_meta === m.id_meta), (a) => Number(a.monto)),
        sugerencia: m.descripcion || '', recordatorio: 'Fecha límite: ' + m.fecha_limite, recordatorioActivo: false,
      })),
      proyeccion: fechas.map((p) => ({
        label: p.etiqueta, valor: suma(aportesMeta.filter((a) => dentro(a.fecha_aporte, p)), (a) => Number(a.monto)),
        etiqueta: p.etiqueta.split(' ')[0],
      })),
    };
  },
  async getImpulsivas() {
    const db = getSupabase();
    const actual = mesActual();
    const anterior = mesActual(-1);
    const [cats, datos, compras] = await Promise.all([
      categorias(), movimientos(anterior.inicio, actual.fin),
      filas<CompraImpulsiva>((a, b) => db.from('compra_impulsiva').select('*').order('id_compra_impulsiva').range(a, b)),
    ]);
    const ids = new Set(compras.flatMap((c) => c.id_movimiento == null ? [] : [c.id_movimiento]));
    const egresos = vistas(datos, cats).filter((m) => m.tipo === 'Gasto');
    const impulsos = egresos.filter((m) => m.es_impulsivo || ids.has(m.id_movimiento));
    const actuales = impulsos.filter((m) => dentro(m.fecha_movimiento, actual));
    const total = suma(actuales, (m) => -m.monto);
    const previo = suma(impulsos.filter((m) => dentro(m.fecha_movimiento, anterior)), (m) => -m.monto);
    return {
      mes: actual.etiqueta, total, compras: actuales.length,
      impactoPct: pct(total, suma(egresos.filter((m) => dentro(m.fecha_movimiento, actual)), (m) => -m.monto)),
      variacionPct: pct(total - previo, previo),
      categorias: grupos(actuales, cats),
      compras24h: actuales.filter((m) => Date.parse(m.fecha_registro.endsWith('Z') ? m.fecha_registro : m.fecha_registro + 'Z') >= Date.now() - 86400000).length,
    };
  },
  async getResumen() {
    const actual = mesActual();
    const previo = mesActual(-1);
    const [cats, datos, aportesMeta] = await Promise.all([categorias(), movimientos(previo.inicio, actual.fin), aportes()]);
    const lista = vistas(datos, cats);
    const actuales = lista.filter((m) => dentro(m.fecha_movimiento, actual));
    const antes = lista.filter((m) => dentro(m.fecha_movimiento, previo));
    const ahorro = (p: ReturnType<typeof periodo>) => suma(aportesMeta.filter((a) => dentro(a.fecha_aporte, p)), (a) => Number(a.monto));
    const actualTotales = { ...totales(actuales), ahorro: ahorro(actual) };
    const anterior = { ...totales(antes), ahorro: ahorro(previo) };
    const variacion = (valor: number, antes: number) => ({ valor, var: pct(valor - antes, antes) });
    return {
      ingresos: variacion(actualTotales.ingresos, anterior.ingresos),
      gastos: variacion(actualTotales.gastos, anterior.gastos),
      ahorro: variacion(actualTotales.ahorro, anterior.ahorro),
      anterior, balanceNeto: actualTotales.ingresos - actualTotales.gastos - actualTotales.ahorro,
      ...porFrecuencia(actuales),
      mayorVariable: grupos(actuales.filter((m) => m.tipo === 'Gasto' && m.frecuencia === 'Variable'), cats)[0] ?? { nombre: 'Sin gastos variables', monto: 0, pct: 0 },
      categorias: grupos(actuales.filter((m) => m.tipo === 'Gasto'), cats),
    };
  },
  getAlertas() {
    const db = getSupabase();
    return filas<Alerta>((a, b) => db.from('alerta').select('*').order('fecha_generacion', { ascending: false })
      .order('id_alerta', { ascending: false }).range(a, b));
  },
  async marcarAlerta(id: number) {
    const { error } = await getSupabase().from('alerta').update({ fecha_lectura: new Date().toISOString() })
      .eq('id_alerta', id).is('fecha_lectura', null);
    if (error) throw new Error(error.message);
  },
  async createMovimiento(m: NuevoMovimiento) {
    if (!Number.isFinite(m.monto) || m.monto <= 0 || !/^\d{1,12}(\.\d{1,2})?$/.test(String(m.monto))) {
      throw new Error('Ingresa un monto positivo con hasta dos decimales.');
    }
    const [perfil, cats] = await Promise.all([perfilActual(), categorias()]);
    if (!cats.some((c) => c.id_categoria === m.id_categoria && c.tipo === m.tipo && c.activa)) {
      throw new Error('Selecciona una categoría activa para este tipo de movimiento.');
    }
    if (!m.id_metodo_pago) throw new Error('Selecciona un método de pago.');
    if (m.ambito === 'Negocio' && !m.id_emprendimiento) throw new Error('Selecciona un emprendimiento.');
    const { error } = await getSupabase().from('movimiento').insert({
      id_usuario: perfil.id_usuario,
      id_emprendimiento: m.ambito === 'Negocio' ? m.id_emprendimiento : null,
      id_categoria: m.id_categoria, id_metodo_pago: m.id_metodo_pago, monto: m.monto,
      fecha_movimiento: m.fecha, descripcion: m.nota?.trim() || null, fecha_registro: new Date().toISOString(),
      frecuencia: m.frecuencia, es_impulsivo: m.tipo === 'Gasto' && Boolean(m.impulsivo),
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  },
};
