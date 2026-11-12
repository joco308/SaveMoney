import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";
import { ApiError } from "../types/api-error";
import { evaluarAlertasPresupuesto, evaluarAlertasComprasFinalizadas } from "./alerta.service";

const ESTADO_EN_ESPERA = 1;
const ESTADO_COMPRADA = 2;
const ESTADO_DESCARTADA = 3;

const compraInclude = {
  categoria: {
    include: {
      tipo_categoria: {
        include: {
          tipo_movimiento: true,
        },
      },
    },
  },
  estado_espera: true,
  movimiento: {
    include: {
      metodo_pago: true,
      categoria: true,
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

async function validarCategoria(
  idCategoria: number,
  usuarioId: bigint,
  client: typeof prisma | Prisma.TransactionClient = prisma,
) {
  const categoria = await client.categoria.findFirst({
    where: {
      id_categoria: idCategoria,
      activa: true,
      OR: [
        { id_usuario: null },
        { id_usuario: usuarioId },
      ],
    },
    include: {
      tipo_categoria: true,
    },
  });

  if (!categoria) {
    throw ApiError.badRequest(
      "La categoría no existe, está inactiva o no te pertenece",
    );
  }

  if (categoria.tipo_categoria.nombre !== "Gastos") {
    throw ApiError.badRequest(
      "Las compras impulsivas deben utilizar una categoría de gastos",
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

async function obtenerCompraPropia(
  id: bigint,
  usuarioId: bigint,
) {
  const compra = await prisma.compra_impulsiva.findFirst({
    where: {
      id_compra_impulsiva: id,
      id_usuario: usuarioId,
    },
    include: compraInclude,
  });

  if (!compra) {
    throw ApiError.notFound("Compra impulsiva no encontrada");
  }

  return compra;
}

function verificarEnEspera(compra: { id_estado_espera: number }) {
  if (compra.id_estado_espera !== ESTADO_EN_ESPERA) {
    throw ApiError.conflict(
      "Esta compra ya fue resuelta y no puede modificarse",
    );
  }
}

export async function listarComprasImpulsivas(
  usuarioId: bigint,
  filtros: {
    page: number;
    limit: number;
    id_estado_espera?: number;
  },
) {
  const where = {
    id_usuario: usuarioId,
    ...(filtros.id_estado_espera !== undefined
      ? { id_estado_espera: filtros.id_estado_espera }
      : {}),
  };

  await evaluarAlertasComprasFinalizadas(usuarioId);

  const [compras, total] = await Promise.all([
    prisma.compra_impulsiva.findMany({
      where,
      include: compraInclude,
      orderBy: [
        { fecha_inicio_espera: "desc" },
        { id_compra_impulsiva: "desc" },
      ],
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.compra_impulsiva.count({ where }),
  ]);

  return {
    compras: serializar(compras),
    paginacion: {
      pagina: filtros.page,
      limite: filtros.limit,
      total,
      totalPaginas: Math.ceil(total / filtros.limit),
    },
  };
}

export async function obtenerCompraImpulsiva(
  id: bigint,
  usuarioId: bigint,
) {
  return serializar(await obtenerCompraPropia(id, usuarioId));
}

export async function crearCompraImpulsiva(
  usuarioId: bigint,
  data: {
    id_categoria: number;
    articulo: string;
    monto_estimado: number;
    motivo?: string | null;
    dias_espera: number;
  },
) {
  await validarCategoria(data.id_categoria, usuarioId);

  const inicio = new Date();
  const fin = new Date(
    inicio.getTime() + data.dias_espera * 24 * 60 * 60 * 1000,
  );

  const compra = await prisma.compra_impulsiva.create({
    data: {
      id_usuario: usuarioId,
      id_categoria: data.id_categoria,
      id_estado_espera: ESTADO_EN_ESPERA,
      articulo: data.articulo,
      monto_estimado: data.monto_estimado,
      motivo: data.motivo,
      fecha_inicio_espera: inicio,
      fecha_fin_espera: fin,
    },
    include: compraInclude,
  });

  return serializar(compra);
}

export async function actualizarCompraImpulsiva(
  id: bigint,
  usuarioId: bigint,
  data: {
    id_categoria?: number;
    articulo?: string;
    monto_estimado?: number;
    motivo?: string | null;
    dias_espera?: number;
  },
) {
  const existente = await obtenerCompraPropia(id, usuarioId);
  verificarEnEspera(existente);

  if (data.id_categoria !== undefined) {
    await validarCategoria(data.id_categoria, usuarioId);
  }

  const fechaFin = data.dias_espera !== undefined
    ? new Date(
        existente.fecha_inicio_espera.getTime() +
        data.dias_espera * 24 * 60 * 60 * 1000,
      )
    : undefined;

  const actualizacion = await prisma.compra_impulsiva.updateMany({
    where: {
      id_compra_impulsiva: id,
      id_usuario: usuarioId,
      id_estado_espera: ESTADO_EN_ESPERA,
    },
    data: {
      id_categoria: data.id_categoria,
      articulo: data.articulo,
      monto_estimado: data.monto_estimado,
      motivo: data.motivo,
      fecha_fin_espera: fechaFin,
    },
  });

  if (actualizacion.count !== 1) {
    throw ApiError.conflict(
      "La compra ya no está pendiente y no puede modificarse",
    );
  }

  const compra = await prisma.compra_impulsiva.findFirst({
    where: {
      id_compra_impulsiva: id,
      id_usuario: usuarioId,
    },
    include: compraInclude,
  });

  if (!compra) {
    throw ApiError.notFound("Compra impulsiva no encontrada");
  }

  return serializar(compra);
}

export async function comprarCompraImpulsiva(
  id: bigint,
  usuarioId: bigint,
  data: {
    id_metodo_pago: number;
    monto: number;
    fecha_movimiento: string;
    id_emprendimiento?: bigint;
    descripcion?: string;
  },
) {
  await validarMetodoPago(data.id_metodo_pago);
  await validarEmprendimiento(data.id_emprendimiento, usuarioId);

  const resultado = await prisma.$transaction(async (tx) => {
    const compra = await tx.compra_impulsiva.findFirst({
      where: {
        id_compra_impulsiva: id,
        id_usuario: usuarioId,
      },
    });

    if (!compra) {
      throw ApiError.notFound("Compra impulsiva no encontrada");
    }

    verificarEnEspera(compra);

    if (new Date() < compra.fecha_fin_espera) {
      throw ApiError.conflict(
        "Todavía no terminó el período de espera de esta compra",
      );
    }

    await validarCategoria(compra.id_categoria, usuarioId, tx as typeof prisma);

    const reserva = await tx.compra_impulsiva.updateMany({
      where: {
        id_compra_impulsiva: id,
        id_usuario: usuarioId,
        id_estado_espera: ESTADO_EN_ESPERA,
        fecha_fin_espera: { lte: new Date() },
      },
      data: {
        id_estado_espera: ESTADO_COMPRADA,
        fecha_resolucion: new Date(),
      },
    });

    if (reserva.count !== 1) {
      throw ApiError.conflict(
        "La compra ya fue resuelta o todavía está en período de espera",
      );
    }

    const movimiento = await tx.movimiento.create({
      data: {
        id_usuario: usuarioId,
        id_categoria: compra.id_categoria,
        id_metodo_pago: data.id_metodo_pago,
        id_emprendimiento: data.id_emprendimiento,
        monto: data.monto,
        fecha_movimiento: new Date(
          `${data.fecha_movimiento}T00:00:00.000Z`,
        ),
        descripcion: data.descripcion ?? `Compra impulsiva: ${compra.articulo}`,
        fecha_registro: new Date(),
      },
    });

    const actualizada = await tx.compra_impulsiva.update({
      where: { id_compra_impulsiva: id },
      data: {
        id_movimiento: movimiento.id_movimiento,
      },
      include: compraInclude,
    });

    return actualizada;
  });

  if (resultado.movimiento) {
    await evaluarAlertasPresupuesto(
      usuarioId,
      resultado.movimiento.fecha_movimiento,
      resultado.movimiento.id_emprendimiento,
    );
  }

  return serializar(resultado);
}

export async function descartarCompraImpulsiva(
  id: bigint,
  usuarioId: bigint,
) {
  const compra = await obtenerCompraPropia(id, usuarioId);
  verificarEnEspera(compra);

  const resultado = await prisma.compra_impulsiva.updateMany({
    where: {
      id_compra_impulsiva: id,
      id_usuario: usuarioId,
      id_estado_espera: ESTADO_EN_ESPERA,
    },
    data: {
      id_estado_espera: ESTADO_DESCARTADA,
      fecha_resolucion: new Date(),
    },
  });

  if (resultado.count !== 1) {
    throw ApiError.conflict(
      "La compra ya fue resuelta y no puede descartarse",
    );
  }

  const actualizada = await prisma.compra_impulsiva.findFirst({
    where: {
      id_compra_impulsiva: id,
      id_usuario: usuarioId,
    },
    include: compraInclude,
  });

  if (!actualizada) {
    throw ApiError.notFound("Compra impulsiva no encontrada");
  }

  return serializar(actualizada);
}

export async function eliminarCompraImpulsiva(
  id: bigint,
  usuarioId: bigint,
) {
  const compra = await obtenerCompraPropia(id, usuarioId);
  verificarEnEspera(compra);

  if (compra.id_movimiento !== null) {
    throw ApiError.conflict(
      "No se puede eliminar una compra vinculada con un movimiento",
    );
  }

  const cantidadAlertas = await prisma.alerta.count({
    where: {
      id_compra_impulsiva: id,
    },
  });

  if (cantidadAlertas > 0) {
    throw ApiError.conflict(
      "No se puede eliminar una compra que tiene alertas relacionadas",
    );
  }

  await prisma.compra_impulsiva.delete({
    where: { id_compra_impulsiva: id },
  });

  return {
    mensaje: "Compra impulsiva eliminada correctamente",
  };
}
