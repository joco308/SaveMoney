import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";
import { escribir } from "./operacion.service";
import type { Crear, Actualizar } from "../schemas/aporte_meta.schema";
import type { Paginacion } from "../schemas/recurso.schema";

export async function listar(id_usuario: bigint, filtros: Paginacion, parentId?: bigint) {
  const where = { id_meta: parentId!, meta_ahorro: { id_usuario } };
  if (!await prisma.meta_ahorro.findFirst({ where: { id_meta: parentId!, id_usuario } })) throw ApiError.notFound("Recurso padre no encontrado");
  const [registros, total] = await prisma.$transaction([
    prisma.aporte_meta.findMany({ where, orderBy: { id_aporte: "desc" }, skip: (filtros.page - 1) * filtros.limit, take: filtros.limit }),
    prisma.aporte_meta.count({ where }),
  ], { isolationLevel: "RepeatableRead" });
  return { registros, paginacion: { pagina: filtros.page, limite: filtros.limit, total, totalPaginas: Math.ceil(total / filtros.limit) } };
}

export async function obtener(id_usuario: bigint, id: bigint, parentId?: bigint) {
  const registro = await prisma.aporte_meta.findFirst({ where: { id_aporte: id, ...{ id_meta: parentId!, meta_ahorro: { id_usuario } } } });
  if (!registro) throw ApiError.notFound();
  return registro;
}

export async function crear(id_usuario: bigint, data: Crear, parentId?: bigint) {
  return escribir(async (tx) => {
    const padre = await tx.meta_ahorro.findFirst({ where: { id_meta: parentId!, id_usuario } });
    if (!padre) throw ApiError.notFound("Recurso padre no encontrado");
    const estado = await tx.estado_meta.findUnique({ where: { id_estado_meta: padre.id_estado_meta } });
  if (estado?.nombre !== "Activa") throw new ApiError(409, "CONFLICT", "Solo se admiten aportes en metas activas");
  if (data.fecha_aporte < padre.fecha_inicio || data.fecha_aporte > padre.fecha_limite) {
    throw ApiError.badRequest("La fecha del aporte debe estar dentro del periodo de la meta");
  }
    return tx.aporte_meta.create({ data: { ...data, id_meta: parentId!,  } });
  });
}

export async function actualizar(id_usuario: bigint, id: bigint, cambios: Actualizar, parentId?: bigint) {
  return escribir(async (tx) => {
    const padre = await tx.meta_ahorro.findFirst({ where: { id_meta: parentId!, id_usuario } });
    if (!padre) throw ApiError.notFound("Recurso padre no encontrado");
    const existente = await tx.aporte_meta.findFirst({ where: { id_aporte: id, ...{ id_meta: parentId!, meta_ahorro: { id_usuario } } } });
    if (!existente) throw ApiError.notFound();
    const data = { ...existente, ...cambios };
    const estado = await tx.estado_meta.findUnique({ where: { id_estado_meta: padre.id_estado_meta } });
  if (estado?.nombre !== "Activa") throw new ApiError(409, "CONFLICT", "Solo se admiten aportes en metas activas");
  if (data.fecha_aporte < padre.fecha_inicio || data.fecha_aporte > padre.fecha_limite) {
    throw ApiError.badRequest("La fecha del aporte debe estar dentro del periodo de la meta");
  }
    return tx.aporte_meta.update({ where: { id_aporte: id, ...{ id_meta: parentId!, meta_ahorro: { id_usuario } } }, data: cambios });
  });
}

export async function eliminar(id_usuario: bigint, id: bigint, parentId?: bigint) {
  return escribir(async (tx) => {
    await tx.aporte_meta.delete({ where: { id_aporte: id, ...{ id_meta: parentId!, meta_ahorro: { id_usuario } } } });
  });
}
