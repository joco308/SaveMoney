import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";
import { escribir, validarCategoria } from "./operacion.service";
import type { Crear, Actualizar } from "../schemas/compra_impulsiva.schema";
import type { Paginacion } from "../schemas/recurso.schema";

export async function listar(id_usuario: bigint, filtros: Paginacion, parentId?: bigint) {
  const where = { id_usuario };

  const [registros, total] = await prisma.$transaction([
    prisma.compra_impulsiva.findMany({ where, orderBy: { id_compra_impulsiva: "desc" }, skip: (filtros.page - 1) * filtros.limit, take: filtros.limit }),
    prisma.compra_impulsiva.count({ where }),
  ], { isolationLevel: "RepeatableRead" });
  return { registros, paginacion: { pagina: filtros.page, limite: filtros.limit, total, totalPaginas: Math.ceil(total / filtros.limit) } };
}

export async function obtener(id_usuario: bigint, id: bigint, parentId?: bigint) {
  const registro = await prisma.compra_impulsiva.findFirst({ where: { id_compra_impulsiva: id, id_usuario } });
  if (!registro) throw ApiError.notFound();
  return registro;
}

export async function crear(id_usuario: bigint, data: Crear, parentId?: bigint) {
  return escribir(async (tx) => {

    await validarCategoria(tx, data.id_categoria, id_usuario);
  if (data.fecha_fin_espera < data.fecha_inicio_espera) throw ApiError.badRequest("El fin de espera debe ser posterior al inicio");
  const estado = await tx.estado_espera.findUnique({ where: { id_estado_espera: data.id_estado_espera } });
  if (!estado) throw ApiError.badRequest("Estado de espera inexistente");
  if (estado.nombre === "Pendiente" && (data.id_movimiento != null || data.fecha_resolucion != null)) {
    throw ApiError.badRequest("Una compra pendiente debe carecer de movimiento y fecha de resolución");
  }
  if (estado.nombre === "Comprada" && (data.id_movimiento == null || data.fecha_resolucion == null)) {
    throw ApiError.badRequest("Una compra comprada requiere movimiento y fecha de resolución");
  }
  if (data.fecha_resolucion && (data.fecha_resolucion < data.fecha_inicio_espera || data.fecha_resolucion > new Date())) {
    throw ApiError.badRequest("Fecha de resolución inválida");
  }
  if (data.id_movimiento != null) {
    const movimiento = await tx.movimiento.findFirst({
      where: { id_movimiento: data.id_movimiento, id_usuario },
    });
    if (!movimiento || movimiento.id_categoria !== data.id_categoria) {
      throw ApiError.badRequest("El movimiento debe pertenecer al usuario y a la categoría de la compra");
    }
  }
    return tx.compra_impulsiva.create({ data: { ...data, id_usuario,  } });
  });
}

export async function actualizar(id_usuario: bigint, id: bigint, cambios: Actualizar, parentId?: bigint) {
  return escribir(async (tx) => {

    const existente = await tx.compra_impulsiva.findFirst({ where: { id_compra_impulsiva: id, id_usuario } });
    if (!existente) throw ApiError.notFound();
    const data = { ...existente, ...cambios };
    await validarCategoria(tx, data.id_categoria, id_usuario);
  if (data.fecha_fin_espera < data.fecha_inicio_espera) throw ApiError.badRequest("El fin de espera debe ser posterior al inicio");
  const estado = await tx.estado_espera.findUnique({ where: { id_estado_espera: data.id_estado_espera } });
  if (!estado) throw ApiError.badRequest("Estado de espera inexistente");
  if (estado.nombre === "Pendiente" && (data.id_movimiento != null || data.fecha_resolucion != null)) {
    throw ApiError.badRequest("Una compra pendiente debe carecer de movimiento y fecha de resolución");
  }
  if (estado.nombre === "Comprada" && (data.id_movimiento == null || data.fecha_resolucion == null)) {
    throw ApiError.badRequest("Una compra comprada requiere movimiento y fecha de resolución");
  }
  if (data.fecha_resolucion && (data.fecha_resolucion < data.fecha_inicio_espera || data.fecha_resolucion > new Date())) {
    throw ApiError.badRequest("Fecha de resolución inválida");
  }
  if (data.id_movimiento != null) {
    const movimiento = await tx.movimiento.findFirst({
      where: { id_movimiento: data.id_movimiento, id_usuario },
    });
    if (!movimiento || movimiento.id_categoria !== data.id_categoria) {
      throw ApiError.badRequest("El movimiento debe pertenecer al usuario y a la categoría de la compra");
    }
  }
    return tx.compra_impulsiva.update({ where: { id_compra_impulsiva: id, id_usuario }, data: cambios });
  });
}

export async function eliminar(id_usuario: bigint, id: bigint, parentId?: bigint) {
  return escribir(async (tx) => {
    await tx.compra_impulsiva.delete({ where: { id_compra_impulsiva: id, id_usuario } });
  });
}
