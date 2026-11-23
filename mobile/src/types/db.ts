// Tipos del esquema público de PostgreSQL y modelos para las pantallas.

export interface Usuario {
  id_usuario: number;
  id_perfil: number;
  codigo_moneda: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  activo: boolean;
}

export interface Categoria {
  id_categoria: number;
  id_usuario?: number | null;
  id_tipo_categoria: number;
  nombre: string;
  activa: boolean;
}

export interface Movimiento {
  id_movimiento: number;
  id_usuario: number;
  id_emprendimiento?: number | null;
  id_categoria: number;
  id_metodo_pago: number;
  monto: number;
  fecha_movimiento: string; // YYYY-MM-DD
  descripcion?: string | null;
  fecha_registro: string;
}

export interface Emprendimiento {
  id_emprendimiento: number;
  id_usuario: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface Presupuesto {
  id_presupuesto: number;
  id_usuario: number;
  id_emprendimiento?: number | null;
  anio: number;
  mes: number;
  monto_total: number;
  umbral_alerta_pct: number;
}

export interface PresupuestoCategoria {
  id_limite: number;
  id_presupuesto: number;
  id_categoria: number;
  monto_limite: number;
  umbral_alerta_pct: number;
}

export interface MetaAhorro {
  id_meta: number;
  id_usuario: number;
  id_estado_meta: number;
  nombre: string;
  descripcion?: string | null;
  monto_objetivo: number;
  fecha_inicio: string;
  fecha_limite: string;
}

export interface AporteMeta {
  id_aporte: number;
  id_meta: number;
  monto: number;
  fecha_aporte: string;
  nota?: string | null;
}

export interface CompraImpulsiva {
  id_compra_impulsiva: number;
  id_usuario: number;
  id_categoria: number;
  id_estado_espera: number;
  articulo: string;
  monto_estimado: number;
  motivo?: string | null;
  fecha_inicio_espera: string;
  fecha_fin_espera: string;
  fecha_resolucion?: string | null;
  id_movimiento?: number | null;
}

export interface Alerta {
  id_alerta: number;
  id_usuario: number;
  id_tipo_alerta: number;
  id_presupuesto?: number | null;
  id_limite?: number | null;
  id_meta?: number | null;
  id_compra_impulsiva?: number | null;
  mensaje: string;
  fecha_generacion: string;
  fecha_lectura?: string | null;
}

// ---------- Modelos de vista (lo que consumen las pantallas) ----------
export type Ambito = 'Personal' | 'Negocio';
export type Frecuencia = 'Fijo' | 'Variable';
export type TipoMov = 'Gasto' | 'Ingreso';

export interface MovimientoVista {
  id: number;
  titulo: string;
  detalle: string;
  monto: number; // negativo = gasto
  tipo: TipoMov;
  icono: string;
  frecuencia?: Frecuencia;
}

export interface CategoriaVista {
  id_categoria: number;
  nombre: string;
  icono: string;
}

export interface NuevoMovimiento {
  tipo: TipoMov;
  monto: number;
  ambito: Ambito;
  frecuencia: Frecuencia;
  id_categoria?: number;
  id_metodo_pago?: number;
  id_emprendimiento?: number;
  fecha: string;
  nota?: string;
  impulsivo?: boolean;
}

export interface DashboardData {
  nombre: string;
  disponible: number;
  ingresos: number;
  gastos: number;
  ahorro: number;
  limiteMensual: number;
  distribucion: { nombre: string; pct: number; color: string }[];
  recientes: MovimientoVista[];
}

export interface PresupuestoCat {
  id_categoria: number;
  nombre: string;
  icono: string;
  gastado: number;
  limite: number;
}

export interface PresupuestoData {
  mesLabel: string;
  total: number;
  gastado: number;
  categorias: PresupuestoCat[];
  umbrales: { pct: number; activo: boolean }[];
}

export interface MetaVista {
  id_meta: number;
  nombre: string;
  icono: string;
  objetivo: number;
  ahorrado: number;
  sugerencia: string;
  recordatorio: string;
  programado?: string;
  debito?: string;
  recordatorioActivo: boolean;
}

export interface MetasData {
  totalAcumulado: number;
  objetivoGlobal: number;
  rendimientoMensual: number;
  metas: MetaVista[];
  proyeccion: { label: string; valor: number; etiqueta: string }[];
  racha: number;
}

export interface ImpulsivasData {
  mes: string;
  total: number;
  compras: number;
  impactoPct: number;
  variacionPct: number;
  limite: number;
  diasRestantes: number;
  categorias: { nombre: string; icono: string; monto: number; compras: number; pct: number; color: string }[];
  compras24h: number;
}

export interface ResumenData {
  ingresos: { valor: number; var: number };
  gastos: { valor: number; var: number };
  ahorro: { valor: number; var: number };
  anterior: { ingresos: number; gastos: number; ahorro: number };
  balanceNeto: number;
  fijos: number;
  variables: number;
  mayorVariable: { nombre: string; monto: number; pct: number };
  categorias: { nombre: string; pct: number; color: string }[];
}

export interface NegocioData {
  personal: number;
  negocio: number;
  nombreNegocio: string;
  fijos: number;
  variables: number;
  negocios: { id: number; nombre: string; categoria: string; limite: number }[];
  movimientos: MovimientoVista[];
}
