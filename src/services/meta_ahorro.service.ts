import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";
import { escribir } from "./operacion.service";
import type { Crear, Actualizar } from "../schemas/meta_ahorro.schema";
import type { Paginacion } from "../schemas/recurso.schema";

export async function listar(id_usuario: bigint, filtros: Paginacion, parentId?: bigint) {
  const where = { id_usuario };

  const [registros, total] = await prisma.$transaction([
    prisma.meta_ahorro.findMany({ where, orderBy: { id_meta: "desc" }, skip: (filtros.page - 1) * filtros.limit, take: filtros.limit }),
    prisma.meta_ahorro.count({ where }),
  ], { isolationLevel: "RepeatableRead" });
  return { registros, paginacion: { pagina: filtros.page, limite: filtros.limit, total, totalPaginas: Math.ceil(total / filtros.limit) } };
}

export async function obtener(id_usuario: bigint, id: bigint, parentId?: bigint) {
  const registro = await prisma.meta_ahorro.findFirst({ where: { id_meta: id, id_usuario } });
  if (!registro) throw ApiError.notFound();
  return registro;
}

export async function crear(id_usuario: bigint, data: Crear, parentId?: bigint) {
  return escribir(async (tx) => {

    if (data.fecha_limite < data.fecha_inicio) throw ApiError.badRequest("La fecha límite debe ser igual o posterior al inicio");
  const estado = await tx.estado_meta.findUnique({ where: { id_estado_meta: data.id_estado_meta } });
  if (!estado) throw ApiError.badRequest("Estado de meta inexistente");
    return tx.meta_ahorro.create({ data: { ...data, id_usuario, fecha_creacion: new Date(), } });
  });
}

export async function actualizar(id_usuario: bigint, id: bigint, cambios: Actualizar, parentId?: bigint) {
  return escribir(async (tx) => {

    const existente = await tx.meta_ahorro.findFirst({ where: { id_meta: id, id_usuario } });
    if (!existente) throw ApiError.notFound();
    const data = { ...existente, ...cambios };
    const fueraDePeriodo = await tx.aporte_meta.findFirst({
      where: { id_meta: id, meta_ahorro: { id_usuario },
        OR: [{ fecha_aporte: { lt: data.fecha_inicio } }, { fecha_aporte: { gt: data.fecha_limite } }] },
    });
    if (fueraDePeriodo) throw ApiError.badRequest("El periodo debe incluir los aportes existentes");
    if (data.fecha_limite < data.fecha_inicio) throw ApiError.badRequest("La fecha límite debe ser igual o posterior al inicio");
  const estado = await tx.estado_meta.findUnique({ where: { id_estado_meta: data.id_estado_meta } });
  if (!estado) throw ApiError.badRequest("Estado de meta inexistente");
    return tx.meta_ahorro.update({ where: { id_meta: id, id_usuario }, data: cambios });
  });
}

export async function eliminar(id_usuario: bigint, id: bigint, parentId?: bigint) {
  return escribir(async (tx) => {
    await tx.meta_ahorro.delete({ where: { id_meta: id, id_usuario } });
  });
}
