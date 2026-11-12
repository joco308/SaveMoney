import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";
import { escribir } from "./operacion.service";
import type { Paginacion } from "../schemas/recurso.schema";
export async function listar(id_usuario: bigint, filtros: Paginacion) {
  const [registros, total] = await prisma.$transaction([
    prisma.alerta.findMany({ where: { id_usuario }, orderBy: { id_alerta: "desc" },
      skip: (filtros.page - 1) * filtros.limit, take: filtros.limit }),
    prisma.alerta.count({ where: { id_usuario } }),
  ], { isolationLevel: "RepeatableRead" });
  return { registros, paginacion: { pagina: filtros.page, limite: filtros.limit, total, totalPaginas: Math.ceil(total / filtros.limit) } };
}
export async function obtener(id_usuario: bigint, id_alerta: bigint) {
  const registro = await prisma.alerta.findFirst({ where: { id_alerta, id_usuario } });
  if (!registro) throw ApiError.notFound();
  return registro;
}
export async function marcarLectura(id_usuario: bigint, id_alerta: bigint, leida: boolean) {
  return escribir(async (tx) => {
    const registro = await tx.alerta.findFirst({ where: { id_alerta, id_usuario } });
    if (!registro) throw ApiError.notFound();
    return tx.alerta.update({ where: { id_alerta, id_usuario },
      data: { fecha_lectura: leida ? registro.fecha_lectura ?? new Date() : null } });
  });
}
export async function eliminar(id_usuario: bigint, id_alerta: bigint) {
  return escribir(async (tx) => {
    await tx.alerta.delete({ where: { id_alerta, id_usuario } });
  });
}
