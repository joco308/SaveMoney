import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";
import { escribir } from "./operacion.service";
import type { Crear, Actualizar } from "../schemas/emprendimiento.schema";
import type { Paginacion } from "../schemas/recurso.schema";

export async function listar(id_usuario: bigint, filtros: Paginacion, parentId?: bigint) {
  const where = { id_usuario };

  const [registros, total] = await prisma.$transaction([
    prisma.emprendimiento.findMany({ where, orderBy: { id_emprendimiento: "desc" }, skip: (filtros.page - 1) * filtros.limit, take: filtros.limit }),
    prisma.emprendimiento.count({ where }),
  ], { isolationLevel: "RepeatableRead" });
  return { registros, paginacion: { pagina: filtros.page, limite: filtros.limit, total, totalPaginas: Math.ceil(total / filtros.limit) } };
}

export async function obtener(id_usuario: bigint, id: bigint, parentId?: bigint) {
  const registro = await prisma.emprendimiento.findFirst({ where: { id_emprendimiento: id, id_usuario } });
  if (!registro) throw ApiError.notFound();
  return registro;
}

export async function crear(id_usuario: bigint, data: Crear, parentId?: bigint) {
  return escribir(async (tx) => {


    return tx.emprendimiento.create({ data: { ...data, id_usuario, fecha_creacion: new Date(), } });
  });
}

export async function actualizar(id_usuario: bigint, id: bigint, cambios: Actualizar, parentId?: bigint) {
  return escribir(async (tx) => {

    const existente = await tx.emprendimiento.findFirst({ where: { id_emprendimiento: id, id_usuario } });
    if (!existente) throw ApiError.notFound();
    const data = { ...existente, ...cambios };

    return tx.emprendimiento.update({ where: { id_emprendimiento: id, id_usuario }, data: cambios });
  });
}

export async function eliminar(id_usuario: bigint, id: bigint, parentId?: bigint) {
  return escribir(async (tx) => {
    await tx.emprendimiento.delete({ where: { id_emprendimiento: id, id_usuario } });
  });
}
