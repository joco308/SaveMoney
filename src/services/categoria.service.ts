import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";

const categoriaInclude = {
  tipo_categoria: {
    include: {
      tipo_movimiento: true,
    },
  },
};

export async function listarCategorias(
  usuarioId: bigint,
  page: number,
  limit: number,
  idTipoCategoria?: number,
) {
  const where = {
    OR: [
      { id_usuario: null },
      { id_usuario: usuarioId },
    ],
    ...(idTipoCategoria !== undefined
      ? { id_tipo_categoria: idTipoCategoria }
      : {}),
  };

  const [categorias, total] = await Promise.all([
    prisma.categoria.findMany({
      where,
      include: categoriaInclude,
      orderBy: { nombre: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.categoria.count({ where }),
  ]);

  return {
    categorias,
    paginacion: {
      pagina: page,
      limite: limit,
      total,
      totalPaginas: Math.ceil(total / limit),
    },
  };
}

export async function obtenerCategoria(
  id: number,
  usuarioId: bigint,
) {
  const categoria = await prisma.categoria.findFirst({
    where: {
      id_categoria: id,
      OR: [
        { id_usuario: null },
        { id_usuario: usuarioId },
      ],
    },
    include: categoriaInclude,
  });

  if (!categoria) {
    throw ApiError.notFound("Categoría no encontrada");
  }

  return categoria;
}

export async function crearCategoria(
  usuarioId: bigint,
  data: { nombre: string; id_tipo_categoria: number },
) {
  const tipo = await prisma.tipo_categoria.findUnique({
    where: { id_tipo_categoria: data.id_tipo_categoria },
  });

  if (!tipo) {
    throw ApiError.badRequest("El tipo de categoría no existe");
  }

  return prisma.categoria.create({
    data: {
      nombre: data.nombre,
      id_tipo_categoria: data.id_tipo_categoria,
      id_usuario: usuarioId,
      activa: true,
    },
    include: categoriaInclude,
  });
}

export async function actualizarCategoria(
  id: number,
  usuarioId: bigint,
  data: { nombre?: string; id_tipo_categoria?: number },
) {
  const categoria = await prisma.categoria.findFirst({
    where: {
      id_categoria: id,
      id_usuario: usuarioId,
    },
    include: {
      _count: {
        select: {
          movimiento: true,
          compra_impulsiva: true,
          presupuesto_categoria: true,
        },
      },
    },
  });

  if (!categoria) {
    throw ApiError.notFound(
      "Categoría personal no encontrada",
    );
  }

  if (
    data.id_tipo_categoria !== undefined &&
    data.id_tipo_categoria !== categoria.id_tipo_categoria
  ) {
    const referencias =
      categoria._count.movimiento +
      categoria._count.compra_impulsiva +
      categoria._count.presupuesto_categoria;

    if (referencias > 0) {
      throw new ApiError(
        409,
        "CONFLICT",
        "No se puede cambiar el tipo de una categoría que tiene registros relacionados. Puedes modificar su nombre.",
      );
    }
    const tipo = await prisma.tipo_categoria.findUnique({
      where: { id_tipo_categoria: data.id_tipo_categoria },
    });

    if (!tipo) {
      throw ApiError.badRequest("El tipo de categoría no existe");
    }
  }

  return prisma.categoria.update({
    where: { id_categoria: id },
    data,
    include: categoriaInclude,
  });
}

export async function cambiarEstadoCategoria(
  id: number,
  usuarioId: bigint,
  activa: boolean,
) {
  const categoria = await prisma.categoria.findFirst({
    where: {
      id_categoria: id,
      id_usuario: usuarioId,
    },
  });

  if (!categoria) {
    throw ApiError.notFound(
      "Categoría personal no encontrada",
    );
  }

  return prisma.categoria.update({
    where: { id_categoria: id },
    data: { activa },
    include: categoriaInclude,
  });
}

export async function eliminarCategoria(
  id: number,
  usuarioId: bigint,
) {
  const categoria = await prisma.categoria.findFirst({
    where: {
      id_categoria: id,
      id_usuario: usuarioId,
    },
    include: {
      _count: {
        select: {
          movimiento: true,
          compra_impulsiva: true,
          presupuesto_categoria: true,
        },
      },
    },
  });

  if (!categoria) {
    throw ApiError.notFound(
      "Categoría personal no encontrada",
    );
  }

  const referencias =
    categoria._count.movimiento +
    categoria._count.compra_impulsiva +
    categoria._count.presupuesto_categoria;

  if (referencias > 0) {
    throw new ApiError(
      409,
      "CONFLICT",
      "No se puede eliminar la categoría porque tiene registros relacionados. Puedes desactivarla.",
    );
  }

  await prisma.categoria.delete({
    where: { id_categoria: id },
  });

  return { mensaje: "Categoría eliminada correctamente" };
}
