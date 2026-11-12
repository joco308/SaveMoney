import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";
import { escribir, validarCategoria } from "./operacion.service";
import type { Crear, Actualizar } from "../schemas/presupuesto_categoria.schema";
import type { Paginacion } from "../schemas/recurso.schema";

export async function listar(id_usuario: bigint, filtros: Paginacion, parentId?: bigint) {
  const where = { id_presupuesto: parentId!, presupuesto: { id_usuario } };
  if (!await prisma.presupuesto.findFirst({ where: { id_presupuesto: parentId!, id_usuario } })) throw ApiError.notFound("Recurso padre no encontrado");
  const [registros, total] = await prisma.$transaction([
    prisma.presupuesto_categoria.findMany({ where, orderBy: { id_limite: "desc" }, skip: (filtros.page - 1) * filtros.limit, take: filtros.limit }),
    prisma.presupuesto_categoria.count({ where }),
  ], { isolationLevel: "RepeatableRead" });
  return { registros, paginacion: { pagina: filtros.page, limite: filtros.limit, total, totalPaginas: Math.ceil(total / filtros.limit) } };
}

export async function obtener(id_usuario: bigint, id: bigint, parentId?: bigint) {
  const registro = await prisma.presupuesto_categoria.findFirst({ where: { id_limite: id, ...{ id_presupuesto: parentId!, presupuesto: { id_usuario } } } });
  if (!registro) throw ApiError.notFound();
  return registro;
}

export async function crear(id_usuario: bigint, data: Crear, parentId?: bigint) {
  return escribir(async (tx) => {
    const padre = await tx.presupuesto.findFirst({ where: { id_presupuesto: parentId!, id_usuario } });
    if (!padre) throw ApiError.notFound("Recurso padre no encontrado");
    await validarCategoria(tx, data.id_categoria, id_usuario);
  if (padre.monto_total.lessThan(data.monto_limite)) throw ApiError.badRequest("El límite supera el presupuesto total");
  const duplicado = await tx.presupuesto_categoria.findFirst({
    where: { id_presupuesto: parentId!, id_categoria: data.id_categoria, presupuesto: { id_usuario },
       },
  });
  if (duplicado) throw new ApiError(409, "CONFLICT", "La categoría ya tiene un límite en este presupuesto");
    return tx.presupuesto_categoria.create({ data: { ...data, id_presupuesto: parentId!,  } });
  });
}

export async function actualizar(id_usuario: bigint, id: bigint, cambios: Actualizar, parentId?: bigint) {
  return escribir(async (tx) => {
    const padre = await tx.presupuesto.findFirst({ where: { id_presupuesto: parentId!, id_usuario } });
    if (!padre) throw ApiError.notFound("Recurso padre no encontrado");
    const existente = await tx.presupuesto_categoria.findFirst({ where: { id_limite: id, ...{ id_presupuesto: parentId!, presupuesto: { id_usuario } } } });
    if (!existente) throw ApiError.notFound();
    const data = { ...existente, ...cambios };
    await validarCategoria(tx, data.id_categoria, id_usuario);
  if (padre.monto_total.lessThan(data.monto_limite)) throw ApiError.badRequest("El límite supera el presupuesto total");
  const duplicado = await tx.presupuesto_categoria.findFirst({
    where: { id_presupuesto: parentId!, id_categoria: data.id_categoria, presupuesto: { id_usuario },
      id_limite: { not: id } },
  });
  if (duplicado) throw new ApiError(409, "CONFLICT", "La categoría ya tiene un límite en este presupuesto");
    return tx.presupuesto_categoria.update({ where: { id_limite: id, ...{ id_presupuesto: parentId!, presupuesto: { id_usuario } } }, data: cambios });
  });
}

export async function eliminar(id_usuario: bigint, id: bigint, parentId?: bigint) {
  return escribir(async (tx) => {
    await tx.presupuesto_categoria.delete({ where: { id_limite: id, ...{ id_presupuesto: parentId!, presupuesto: { id_usuario } } } });
  });
}
