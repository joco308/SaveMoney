import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";

const movimientoInclude = {
  categoria: {
    include: {
      tipo_categoria: {
        include: {
          tipo_movimiento: true,
        },
      },
    },
  },
  metodo_pago: true,
  emprendimiento: true,
};

function serializarMovimiento<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  ) as T;
}

async function validarCategoria(
  idCategoria: number,
  usuarioId: bigint,
) {
  const categoria = await prisma.categoria.findFirst({
    where: {
      id_categoria: idCategoria,
      activa: true,
      OR: [
        { id_usuario: null },
        { id_usuario: usuarioId },
      ],
    },
  });

  if (!categoria) {
    throw ApiError.badRequest(
      "La categoría no existe, está inactiva o no te pertenece",
    );
  }
}

async function validarMetodoPago(idMetodoPago: number) {
  const metodo = await prisma.metodo_pago.findUnique({
    where: { id_metodo_pago: idMetodoPago },
  });

  if (!metodo) {
    throw ApiError.badRequest("El método de pago no existe");
  }
}

async function validarEmprendimiento(
  idEmprendimiento: bigint | undefined,
  usuarioId: bigint,
) {
  if (idEmprendimiento === undefined) return;

  const emprendimiento = await prisma.emprendimiento.findFirst({
    where: {
      id_emprendimiento: idEmprendimiento,
      id_usuario: usuarioId,
      activo: true,
    },
  });

  if (!emprendimiento) {
    throw ApiError.badRequest(
      "El emprendimiento no existe, está inactivo o no te pertenece",
    );
  }
}

export async function listarMovimientos(
  usuarioId: bigint,
  filtros: {
    page: number;
    limit: number;
    id_categoria?: number;
    id_metodo_pago?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  },
) {
  const where = {
    id_usuario: usuarioId,
    ...(filtros.id_categoria !== undefined
      ? { id_categoria: filtros.id_categoria }
      : {}),
    ...(filtros.id_metodo_pago !== undefined
      ? { id_metodo_pago: filtros.id_metodo_pago }
      : {}),
    ...(filtros.fecha_desde || filtros.fecha_hasta
      ? {
          fecha_movimiento: {
            ...(filtros.fecha_desde
              ? { gte: new Date(`${filtros.fecha_desde}T00:00:00.000Z`) }
              : {}),
            ...(filtros.fecha_hasta
              ? { lte: new Date(`${filtros.fecha_hasta}T00:00:00.000Z`) }
              : {}),
          },
        }
      : {}),
  };

  const [movimientos, total] = await Promise.all([
    prisma.movimiento.findMany({
      where,
      include: movimientoInclude,
      orderBy: [
        { fecha_movimiento: "desc" },
        { id_movimiento: "desc" },
      ],
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.movimiento.count({ where }),
  ]);

  return {
    movimientos: serializarMovimiento(movimientos),
    paginacion: {
      pagina: filtros.page,
      limite: filtros.limit,
      total,
      totalPaginas: Math.ceil(total / filtros.limit),
    },
  };
}

export async function obtenerMovimiento(
  id: bigint,
  usuarioId: bigint,
) {
  const movimiento = await prisma.movimiento.findFirst({
    where: {
      id_movimiento: id,
      id_usuario: usuarioId,
    },
    include: movimientoInclude,
  });

  if (!movimiento) {
    throw ApiError.notFound("Movimiento no encontrado");
  }

  return serializarMovimiento(movimiento);
}

export async function crearMovimiento(
  usuarioId: bigint,
  data: {
    id_categoria: number;
    id_metodo_pago: number;
    id_emprendimiento?: bigint;
    monto: number;
    fecha_movimiento: string;
    descripcion?: string;
  },
) {
  await validarCategoria(data.id_categoria, usuarioId);
  await validarMetodoPago(data.id_metodo_pago);
  await validarEmprendimiento(data.id_emprendimiento, usuarioId);

  const movimiento = await prisma.movimiento.create({
    data: {
      id_usuario: usuarioId,
      id_categoria: data.id_categoria,
      id_metodo_pago: data.id_metodo_pago,
      id_emprendimiento: data.id_emprendimiento,
      monto: data.monto,
      fecha_movimiento: new Date(
        `${data.fecha_movimiento}T00:00:00.000Z`,
      ),
      descripcion: data.descripcion,
      fecha_registro: new Date(),
    },
    include: movimientoInclude,
  });

  return serializarMovimiento(movimiento);
}

export async function actualizarMovimiento(
  id: bigint,
  usuarioId: bigint,
  data: {
    id_categoria?: number;
    id_metodo_pago?: number;
    id_emprendimiento?: bigint;
    monto?: number;
    fecha_movimiento?: string;
    descripcion?: string;
  },
) {
  const existente = await prisma.movimiento.findFirst({
    where: {
      id_movimiento: id,
      id_usuario: usuarioId,
    },
  });

  if (!existente) {
    throw ApiError.notFound("Movimiento no encontrado");
  }

  if (data.id_categoria !== undefined) {
    await validarCategoria(data.id_categoria, usuarioId);
  }

  if (data.id_metodo_pago !== undefined) {
    await validarMetodoPago(data.id_metodo_pago);
  }

  if (data.id_emprendimiento !== undefined) {
    await validarEmprendimiento(data.id_emprendimiento, usuarioId);
  }

  const movimiento = await prisma.movimiento.update({
    where: { id_movimiento: id },
    data: {
      ...data,
      fecha_movimiento: data.fecha_movimiento
        ? new Date(`${data.fecha_movimiento}T00:00:00.000Z`)
        : undefined,
    },
    include: movimientoInclude,
  });

  return serializarMovimiento(movimiento);
}

export async function eliminarMovimiento(
  id: bigint,
  usuarioId: bigint,
) {
  const existente = await prisma.movimiento.findFirst({
    where: {
      id_movimiento: id,
      id_usuario: usuarioId,
    },
    include: {
      compra_impulsiva: true,
    },
  });

  if (!existente) {
    throw ApiError.notFound("Movimiento no encontrado");
  }

  if (existente.compra_impulsiva) {
    throw new ApiError(
      409,
      "CONFLICT",
      "Este movimiento está relacionado con una compra impulsiva y no puede eliminarse directamente",
    );
  }

  await prisma.movimiento.delete({
    where: { id_movimiento: id },
  });

  return {
    mensaje: "Movimiento eliminado correctamente",
  };
}
