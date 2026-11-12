import { prisma } from "../config/prisma";
import type { Prisma } from "../generated/prisma/client";
import { ApiError } from "../types/api-error";

export async function escribir<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let intento = 0; intento < 3; intento++) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: "Serializable" });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "P2034" && intento < 2) continue;
      if (code === "P2025") throw ApiError.notFound();
      if (code === "P2002" || code === "P2003" || code === "P2034") {
        throw new ApiError(409, "CONFLICT", "La operación entra en conflicto con otro registro o una operación simultánea");
      }
      if (code === "P2004") throw ApiError.badRequest("Los datos incumplen una restricción de la base de datos");
      throw error;
    }
  }
  throw new ApiError(409, "CONFLICT", "Reintenta la operación");
}

export async function validarCategoria(tx: Prisma.TransactionClient, id: number, id_usuario: bigint) {
  const categoria = await tx.categoria.findFirst({
    where: { id_categoria: id, activa: true, OR: [{ id_usuario }, { id_usuario: null }] },
    include: { tipo_categoria: { include: { tipo_movimiento: true } } },
  });
  if (!categoria) throw ApiError.badRequest("Categoría inexistente, inactiva o ajena");
  if (categoria.tipo_categoria.tipo_movimiento.nombre !== "Egreso") {
    throw ApiError.badRequest("Se requiere una categoría de egreso");
  }
}
export async function validarEmprendimiento(tx: Prisma.TransactionClient, id: bigint | null | undefined, id_usuario: bigint) {
  if (id == null) return;
  const registro = await tx.emprendimiento.findFirst({
    where: { id_emprendimiento: id, id_usuario, activo: true },
  });
  if (!registro) throw ApiError.badRequest("Emprendimiento inexistente, inactivo o ajeno");
}
