import { colors } from '../theme';
import {
  CategoriaVista,
  DashboardData,
  ImpulsivasData,
  MetasData,
  NegocioData,
  PresupuestoData,
  ResumenData,
} from '../types/db';

export const categoriasGasto: CategoriaVista[] = [
  { id_categoria: 1, nombre: 'Comida', icono: 'silverware-fork-knife' },
  { id_categoria: 2, nombre: 'Transporte', icono: 'car-side' },
  { id_categoria: 3, nombre: 'Ocio', icono: 'gamepad-variant-outline' },
  { id_categoria: 4, nombre: 'Super', icono: 'cart-outline' },
  { id_categoria: 5, nombre: 'Vivienda', icono: 'home-outline' },
  { id_categoria: 6, nombre: 'Salud', icono: 'medical-bag' },
  { id_categoria: 7, nombre: 'Educación', icono: 'school-outline' },
  { id_categoria: 8, nombre: 'Insumos', icono: 'briefcase-outline' },
];

export const dashboard: DashboardData = {
  nombre: 'Rolando',
  disponible: 1050,
  ingresos: 7500,
  gastos: 2650,
  ahorro: 1200,
  limiteMensual: 7500,
  distribucion: [
    { nombre: 'Alimentación', pct: 32, color: colors.primary },
    { nombre: 'Servicios', pct: 25, color: colors.primary },
    { nombre: 'Transporte', pct: 18, color: colors.green },
    { nombre: 'Entretenimiento', pct: 15, color: colors.gray },
  ],
  recientes: [
    { id: 1, titulo: 'Salario Mensual', detalle: 'Banco Nacional • 24 Sep', monto: 3500, tipo: 'Ingreso', icono: 'bank-outline' },
    { id: 2, titulo: 'Supermercado', detalle: 'Gasto Personal • Hoy', monto: -35, tipo: 'Gasto', icono: 'hamburger' },
    { id: 3, titulo: 'Transporte Urbano', detalle: 'Gasolina y Peajes • Ayer', monto: -120, tipo: 'Gasto', icono: 'car-side' },
    { id: 4, titulo: 'Streaming Suscripción', detalle: 'Entretenimiento • 22 Sep', monto: -250, tipo: 'Gasto', icono: 'gamepad-variant-outline' },
  ],
};

export const negocio: NegocioData = {
  personal: 1850,
  negocio: 800,
  nombreNegocio: 'Cafetería & Co.',
  fijos: 1400,
  variables: 1250,
  negocios: [{ id: 1, nombre: 'Cafetería Dulce Aroma', categoria: 'Alimentos y Bebidas', limite: 3000 }],
  movimientos: [
    { id: 11, titulo: 'Insumos de repostería', detalle: 'Cafetería • 23 Sep', monto: -320, tipo: 'Gasto', icono: 'cupcake', frecuencia: 'Variable' },
    { id: 12, titulo: 'Empaques y bolsas', detalle: 'Cafetería • 21 Sep', monto: -180, tipo: 'Gasto', icono: 'shopping-outline', frecuencia: 'Variable' },
    { id: 13, titulo: 'Pago de publicidad local', detalle: 'Cafetería • 19 Sep', monto: -300, tipo: 'Gasto', icono: 'bullhorn-outline', frecuencia: 'Fijo' },
  ],
};

export const presupuesto: PresupuestoData = {
  mesLabel: 'Septiembre 2024',
  total: 5000,
  gastado: 2650,
  categorias: [
    { id_categoria: 1, nombre: 'Alimentación', icono: 'silverware-fork-knife', gastado: 680, limite: 800 },
    { id_categoria: 9, nombre: 'Servicios', icono: 'flash-outline', gastado: 650, limite: 1000 },
    { id_categoria: 2, nombre: 'Transporte', icono: 'car-side', gastado: 240, limite: 500 },
    { id_categoria: 4, nombre: 'Compras', icono: 'shopping-outline', gastado: 360, limite: 600 },
    { id_categoria: 3, nombre: 'Entretenimiento', icono: 'movie-open-outline', gastado: 420, limite: 400 },
  ],
  umbrales: [
    { pct: 50, activo: false },
    { pct: 75, activo: true },
    { pct: 90, activo: true },
    { pct: 100, activo: true },
  ],
};

export const metas: MetasData = {
  totalAcumulado: 5950,
  objetivoGlobal: 13000,
  rendimientoMensual: 850,
  racha: 4,
  metas: [
    {
      id_meta: 1, nombre: 'Nuevo celular', icono: 'cellphone', objetivo: 5000, ahorrado: 2750,
      sugerencia: 'Ahorro sugerido: Bs 100 / semana para llegar a tu fecha límite propuesta.',
      recordatorio: 'Recordatorio: Lunes 28 de sep.', recordatorioActivo: true,
    },
    {
      id_meta: 2, nombre: 'Viaje de vacaciones', icono: 'airplane', objetivo: 8000, ahorrado: 3200,
      sugerencia: '', recordatorio: 'Débito auto: Día 5 de cada mes',
      programado: 'Bs 400 mensual', debito: 'Automático', recordatorioActivo: false,
    },
  ],
  proyeccion: [
    { label: 'Julio', valor: 4200, etiqueta: 'Bs 4.2k' },
    { label: 'Agosto', valor: 5100, etiqueta: 'Bs 5.1k' },
    { label: 'Septiembre (Hoy)', valor: 5900, etiqueta: 'Bs 5.9k' },
    { label: 'Noviembre (Meta)', valor: 13000, etiqueta: 'Bs 13k' },
  ],
};

export const impulsivas: ImpulsivasData = {
  mes: 'Octubre 2024',
  total: 450,
  compras: 8,
  impactoPct: 17,
  variacionPct: 12,
  limite: 600,
  diasRestantes: 12,
  compras24h: 3,
  categorias: [
    { nombre: 'Alimentación / Antojos', icono: 'hamburger', monto: 180, compras: 4, pct: 40, color: colors.amber },
    { nombre: 'Videojuegos y apps', icono: 'gamepad-variant-outline', monto: 120, compras: 2, pct: 26.6, color: '#6366F1' },
    { nombre: 'Compras no planeadas', icono: 'shopping-outline', monto: 95, compras: 1, pct: 21.1, color: '#0F9F8F' },
    { nombre: 'Cafetería y snacks', icono: 'coffee-outline', monto: 55, compras: 1, pct: 12.3, color: '#F97316' },
  ],
};

export const resumen: ResumenData = {
  ingresos: { valor: 7500, var: 7.1 },
  gastos: { valor: 2650, var: -8.6 },
  ahorro: { valor: 1200, var: 9.1 },
  anterior: { ingresos: 7000, gastos: 2900, ahorro: 1100 },
  balanceNeto: 3650,
  fijos: 1400,
  variables: 1250,
  mayorVariable: { nombre: 'Alimentación', monto: 850, pct: 68 },
  categorias: [
    { nombre: 'Alimentación', pct: 32, color: colors.primary },
    { nombre: 'Servicios', pct: 25, color: '#00A070' },
    { nombre: 'Transporte', pct: 18, color: colors.green },
    { nombre: 'Entretenimiento', pct: 15, color: '#5B6478' },
    { nombre: 'Otros', pct: 10, color: colors.blueSoft },
  ],
};
