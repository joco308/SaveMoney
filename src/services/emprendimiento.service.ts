import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";

function serializarEmprendimiento<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  ) as T;
}

export async function listarEmprendimientos(
  usuarioId: bigint,
  page: number,
  limit: number,
  activo?: boolean,
) {
  const where = {
    id_usuario: usuarioId,
    ...(activo !== undefined ? { activo } : {}),
  };

  const [emprendimientos, total] = await Promise.all([
    prisma.emprendimiento.findMany({
      where,
      orderBy: [
        { fecha_creacion: "desc" },
        { id_emprendimiento: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.emprendimiento.count({ where }),
  ]);

  return {
    emprendimientos: serializarEmprendimiento(emprendimientos),
    paginacion: {
      pagina: page,
      limite: limit,
      total,
      totalPaginas: Math.ceil(total / limit),
    },
  };
}

export async function obtenerEmprendimiento(
  id: bigint,
  usuarioId: bigint,
) {
  const emprendimiento = await prisma.emprendimiento.findFirst({
    where: {
      id_emprendimiento: id,
      id_usuario: usuarioId,
    },
  });

  if (!emprendimiento) {
    throw ApiError.notFound("Emprendimiento no encontrado");
  }

  return serializarEmprendimiento(emprendimiento);
}

export async function crearEmprendimiento(
  usuarioId: bigint,
  data: {
    nombre: string;
    descripcion?: string | null;
  },
) {
  const emprendimiento = await prisma.emprendimiento.create({
    data: {
      id_usuario: usuarioId,
      nombre: data.nombre,
      descripcion: data.descripcion ?? null,
      activo: true,
      fecha_creacion: new Date(),
    },
  });

  return serializarEmprendimiento(emprendimiento);
}

export async function actualizarEmprendimiento(
  id: bigint,
  usuarioId: bigint,
  data: {
    nombre?: string;
    descripcion?: string | null;
  },
) {
  const existente = await prisma.emprendimiento.findFirst({
    where: {
      id_emprendimiento: id,
      id_usuario: usuarioId,
    },
  });

  if (!existente) {
    throw ApiError.notFound("Emprendimiento no encontrado");
  }

  const emprendimiento = await prisma.emprendimiento.update({
    where: {
      id_emprendimiento: id,
    },
    data,
  });

  return serializarEmprendimiento(emprendimiento);
}

export async function cambiarEstadoEmprendimiento(
  id: bigint,
  usuarioId: bigint,
  activo: boolean,
) {
  const existente = await prisma.emprendimiento.findFirst({
    where: {
      id_emprendimiento: id,
      id_usuario: usuarioId,
    },
  });

  if (!existente) {
    throw ApiError.notFound("Emprendimiento no encontrado");
  }

  const emprendimiento = await prisma.emprendimiento.update({
    where: {
      id_emprendimiento: id,
    },
    data: { activo },
  });

  return serializarEmprendimiento(emprendimiento);
}

export async function eliminarEmprendimiento(
  id: bigint,
  usuarioId: bigint,
) {
  const emprendimiento = await prisma.emprendimiento.findFirst({
    where: {
      id_emprendimiento: id,
      id_usuario: usuarioId,
    },
    include: {
      _count: {
        select: {
          movimiento: true,
          presupuesto: true,
        },
      },
    },
  });

  if (!emprendimiento) {
    throw ApiError.notFound("Emprendimiento no encontrado");
  }

  const referencias =
    emprendimiento._count.movimiento +
    emprendimiento._count.presupuesto;

  if (referencias > 0) {
    throw new ApiError(
      409,
      "CONFLICT",
      "No se puede eliminar el emprendimiento porque tiene movimientos o presupuestos relacionados. Puedes desactivarlo.",
    );
  }

  await prisma.emprendimiento.delete({
    where: {
      id_emprendimiento: id,
    },
  });

  return {
    mensaje: "Emprendimiento eliminado correctamente",
  };
}
