import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";

const presupuestoInclude = {
  emprendimiento: true,
  presupuesto_categoria: {
    include: {
      categoria: {
        include: {
          tipo_categoria: {
            include: {
              tipo_movimiento: true,
            },
          },
        },
      },
    },
    orderBy: {
      id_limite: "asc" as const,
    },
  },
};

function serializar<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  ) as T;
}

async function validarEmprendimiento(
  idEmprendimiento: bigint | null | undefined,
  usuarioId: bigint,
) {
  if (idEmprendimiento == null) return;

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

async function obtenerPresupuestoPropio(
  id: bigint,
  usuarioId: bigint,
) {
  const presupuesto = await prisma.presupuesto.findFirst({
    where: {
      id_presupuesto: id,
      id_usuario: usuarioId,
    },
  });

  if (!presupuesto) {
    throw ApiError.notFound("Presupuesto no encontrado");
  }

  return presupuesto;
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

export async function listarPresupuestos(
  usuarioId: bigint,
  filtros: {
    page: number;
    limit: number;
    anio?: number;
    mes?: number;
    id_emprendimiento?: bigint;
  },
) {
  const where = {
    id_usuario: usuarioId,
    ...(filtros.anio !== undefined ? { anio: filtros.anio } : {}),
    ...(filtros.mes !== undefined ? { mes: filtros.mes } : {}),
    ...(filtros.id_emprendimiento !== undefined
      ? { id_emprendimiento: filtros.id_emprendimiento }
      : {}),
  };

  const [presupuestos, total] = await Promise.all([
    prisma.presupuesto.findMany({
      where,
      include: presupuestoInclude,
      orderBy: [
        { anio: "desc" },
        { mes: "desc" },
        { id_presupuesto: "desc" },
      ],
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.presupuesto.count({ where }),
  ]);

  return {
    presupuestos: serializar(presupuestos),
    paginacion: {
      pagina: filtros.page,
      limite: filtros.limit,
      total,
      totalPaginas: Math.ceil(total / filtros.limit),
    },
  };
}

export async function obtenerPresupuesto(
  id: bigint,
  usuarioId: bigint,
) {
  const presupuesto = await prisma.presupuesto.findFirst({
    where: {
      id_presupuesto: id,
      id_usuario: usuarioId,
    },
    include: presupuestoInclude,
  });

  if (!presupuesto) {
    throw ApiError.notFound("Presupuesto no encontrado");
  }

  return serializar(presupuesto);
}

export async function crearPresupuesto(
  usuarioId: bigint,
  data: {
    id_emprendimiento?: bigint | null;
    anio: number;
    mes: number;
    monto_total: number;
    umbral_alerta_pct: number;
  },
) {
  await validarEmprendimiento(data.id_emprendimiento, usuarioId);

  const presupuesto = await prisma.presupuesto.create({
    data: {
      id_usuario: usuarioId,
      id_emprendimiento: data.id_emprendimiento ?? null,
      anio: data.anio,
      mes: data.mes,
      monto_total: data.monto_total,
      umbral_alerta_pct: data.umbral_alerta_pct,
      fecha_creacion: new Date(),
    },
    include: presupuestoInclude,
  });

  return serializar(presupuesto);
}

export async function actualizarPresupuesto(
  id: bigint,
  usuarioId: bigint,
  data: {
    id_emprendimiento?: bigint | null;
    anio?: number;
    mes?: number;
    monto_total?: number;
    umbral_alerta_pct?: number;
  },
) {
  await obtenerPresupuestoPropio(id, usuarioId);

  if (data.id_emprendimiento !== undefined) {
    await validarEmprendimiento(data.id_emprendimiento, usuarioId);
  }

  const presupuesto = await prisma.presupuesto.update({
    where: { id_presupuesto: id },
    data: {
      ...data,
    },
    include: presupuestoInclude,
  });

  return serializar(presupuesto);
}

export async function eliminarPresupuesto(
  id: bigint,
  usuarioId: bigint,
) {
  const presupuesto = await prisma.presupuesto.findFirst({
    where: {
      id_presupuesto: id,
      id_usuario: usuarioId,
    },
    include: {
      alerta: true,
      presupuesto_categoria: {
        include: {
          alerta: true,
        },
      },
    },
  });

  if (!presupuesto) {
    throw ApiError.notFound("Presupuesto no encontrado");
  }

  const tieneAlertas =
    presupuesto.alerta.length > 0 ||
    presupuesto.presupuesto_categoria.some(
      (limite) => limite.alerta.length > 0,
    );

  if (tieneAlertas) {
    throw new ApiError(
      409,
      "CONFLICT",
      "No se puede eliminar el presupuesto porque tiene alertas relacionadas",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.presupuesto_categoria.deleteMany({
      where: { id_presupuesto: id },
    });

    await tx.presupuesto.delete({
      where: { id_presupuesto: id },
    });
  });

  return { mensaje: "Presupuesto eliminado correctamente" };
}

export async function agregarLimiteCategoria(
  idPresupuesto: bigint,
  usuarioId: bigint,
  data: {
    id_categoria: number;
    monto_limite: number;
    umbral_alerta_pct: number;
  },
) {
  await obtenerPresupuestoPropio(idPresupuesto, usuarioId);
  await validarCategoria(data.id_categoria, usuarioId);

  const existente = await prisma.presupuesto_categoria.findFirst({
    where: {
      id_presupuesto: idPresupuesto,
      id_categoria: data.id_categoria,
    },
  });

  if (existente) {
    throw new ApiError(
      409,
      "CONFLICT",
      "Esta categoría ya tiene un límite en el presupuesto",
    );
  }

  const limite = await prisma.presupuesto_categoria.create({
    data: {
      id_presupuesto: idPresupuesto,
      id_categoria: data.id_categoria,
      monto_limite: data.monto_limite,
      umbral_alerta_pct: data.umbral_alerta_pct,
    },
    include: {
      categoria: true,
    },
  });

  return serializar(limite);
}

export async function actualizarLimiteCategoria(
  idPresupuesto: bigint,
  idLimite: bigint,
  usuarioId: bigint,
  data: {
    monto_limite?: number;
    umbral_alerta_pct?: number;
  },
) {
  await obtenerPresupuestoPropio(idPresupuesto, usuarioId);

  const limite = await prisma.presupuesto_categoria.findFirst({
    where: {
      id_limite: idLimite,
      id_presupuesto: idPresupuesto,
    },
  });

  if (!limite) {
    throw ApiError.notFound("Límite de categoría no encontrado");
  }

  const actualizado = await prisma.presupuesto_categoria.update({
    where: { id_limite: idLimite },
    data,
    include: {
      categoria: true,
    },
  });

  return serializar(actualizado);
}

export async function eliminarLimiteCategoria(
  idPresupuesto: bigint,
  idLimite: bigint,
  usuarioId: bigint,
) {
  await obtenerPresupuestoPropio(idPresupuesto, usuarioId);

  const limite = await prisma.presupuesto_categoria.findFirst({
    where: {
      id_limite: idLimite,
      id_presupuesto: idPresupuesto,
    },
    include: {
      alerta: true,
    },
  });

  if (!limite) {
    throw ApiError.notFound("Límite de categoría no encontrado");
  }

  if (limite.alerta.length > 0) {
    throw new ApiError(
      409,
      "CONFLICT",
      "No se puede eliminar este límite porque tiene alertas relacionadas",
    );
  }

  await prisma.presupuesto_categoria.delete({
    where: { id_limite: idLimite },
  });

  return { mensaje: "Límite de categoría eliminado correctamente" };
}
