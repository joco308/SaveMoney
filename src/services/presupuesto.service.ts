import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";
import { escribir, validarEmprendimiento } from "./operacion.service";
import type { Crear, Actualizar } from "../schemas/presupuesto.schema";
import type { Paginacion } from "../schemas/recurso.schema";

export async function listar(id_usuario: bigint, filtros: Paginacion, parentId?: bigint) {
  const where = { id_usuario };

  const [registros, total] = await prisma.$transaction([
    prisma.presupuesto.findMany({ where, orderBy: { id_presupuesto: "desc" }, skip: (filtros.page - 1) * filtros.limit, take: filtros.limit }),
    prisma.presupuesto.count({ where }),
  ], { isolationLevel: "RepeatableRead" });
  return { registros, paginacion: { pagina: filtros.page, limite: filtros.limit, total, totalPaginas: Math.ceil(total / filtros.limit) } };
}

export async function obtener(id_usuario: bigint, id: bigint, parentId?: bigint) {
  const registro = await prisma.presupuesto.findFirst({ where: { id_presupuesto: id, id_usuario } });
  if (!registro) throw ApiError.notFound();
  return registro;
}

export async function crear(id_usuario: bigint, data: Crear, parentId?: bigint) {
  return escribir(async (tx) => {

    await validarEmprendimiento(tx, data.id_emprendimiento, id_usuario);
    return tx.presupuesto.create({ data: { ...data, id_usuario, fecha_creacion: new Date(), } });
  });
}

export async function actualizar(id_usuario: bigint, id: bigint, cambios: Actualizar, parentId?: bigint) {
  return escribir(async (tx) => {

    const existente = await tx.presupuesto.findFirst({ where: { id_presupuesto: id, id_usuario } });
    if (!existente) throw ApiError.notFound();
    const data = { ...existente, ...cambios };
    const limites = await tx.presupuesto_categoria.findMany({
      where: { id_presupuesto: id, presupuesto: { id_usuario } },
    });
    if (limites.some((limite) => limite.monto_limite.greaterThan(data.monto_total))) {
      throw ApiError.badRequest("El presupuesto no puede ser inferior a sus límites de categoría");
    }
    await validarEmprendimiento(tx, data.id_emprendimiento, id_usuario);
    return tx.presupuesto.update({ where: { id_presupuesto: id, id_usuario }, data: cambios });
  });
}

export async function eliminar(id_usuario: bigint, id: bigint, parentId?: bigint) {
  return escribir(async (tx) => {
    await tx.presupuesto.delete({ where: { id_presupuesto: id, id_usuario } });
  });
}
