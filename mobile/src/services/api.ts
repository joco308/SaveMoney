// Capa de datos única del frontend.
// Hoy devuelve datos de ejemplo (USE_MOCK = true).
// Al conectar Supabase / los endpoints del backend, solo se reemplaza
// el cuerpo de cada función; las pantallas no cambian.
import {
  categoriasGasto, dashboard, impulsivas, metas, negocio, presupuesto, resumen,
} from '../data/mock';
import {
  Ambito, CategoriaVista, DashboardData, ImpulsivasData, MetasData, NegocioData,
  NuevoMovimiento, PresupuestoData, ResumenData,
} from '../types/db';

export const USE_MOCK = true;
// export const API_URL = process.env.EXPO_PUBLIC_API_URL;

const wait = <T,>(v: T, ms = 250): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));

export const api = {
  getDashboard: (): Promise<DashboardData> => wait(dashboard),
  getCategorias: (): Promise<CategoriaVista[]> => wait(categoriasGasto, 50),
  getNegocio: (_ambito: Ambito | 'Todos' = 'Todos'): Promise<NegocioData> => wait(negocio),
  getPresupuesto: (_anio?: number, _mes?: number): Promise<PresupuestoData> => wait(presupuesto),
  getMetas: (): Promise<MetasData> => wait(metas),
  getImpulsivas: (): Promise<ImpulsivasData> => wait(impulsivas),
  getResumen: (): Promise<ResumenData> => wait(resumen),
  createMovimiento: (m: NuevoMovimiento): Promise<{ ok: true }> => {
    console.log('createMovimiento', m);
    return wait({ ok: true as const }, 400);
  },
};
