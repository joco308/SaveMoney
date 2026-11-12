import { prisma } from "../config/prisma";

// Estos catálogos compartidos no tienen columna id_usuario.
export async function obtenerCatalogos() {
  const [monedas, perfiles, tipos_movimiento, tipos_categoria, metodos_pago, estados_meta, estados_espera, tipos_alerta] = await prisma.$transaction([
    prisma.moneda.findMany({ orderBy: { codigo_moneda: "asc" } }),
    prisma.perfil_usuario.findMany({ orderBy: { id_perfil: "asc" } }),
    prisma.tipo_movimiento.findMany({ orderBy: { id_tipo_movimiento: "asc" } }),
    prisma.tipo_categoria.findMany({ orderBy: { id_tipo_categoria: "asc" } }),
    prisma.metodo_pago.findMany({ orderBy: { id_metodo_pago: "asc" } }),
    prisma.estado_meta.findMany({ orderBy: { id_estado_meta: "asc" } }),
    prisma.estado_espera.findMany({ orderBy: { id_estado_espera: "asc" } }),
    prisma.tipo_alerta.findMany({ orderBy: { id_tipo_alerta: "asc" } }),
  ]);
  return { monedas, perfiles, tipos_movimiento, tipos_categoria, metodos_pago, estados_meta, estados_espera, tipos_alerta };
}
