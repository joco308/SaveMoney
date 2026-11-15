import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";
import { ApiError } from "../types/api-error";
import { generarAlertaMetaCompletada } from "./alerta.service";

const metaInclude = {
  estado_meta: true,
  aporte_meta: {
    orderBy: [
      { fecha_aporte: "desc" as const },
      { id_aporte: "desc" as const },
    ],
  },
};

function aCentavos(valor: unknown): number {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    throw ApiError.badRequest("Se encontró un importe inválido");
  }

  return Math.round(numero * 100);
}

function desdeCentavos(valor: number): number {
  return Number((valor / 100).toFixed(2));
}

function serializar<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  ) as T;
}

function fechaUTC(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

function fechaActualUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function presentarMeta(meta: Prisma.meta_ahorroGetPayload<{ include: typeof metaInclude }>) {
  const totalCentavos = meta.aporte_meta.reduce(
    (total, aporte) => total + aCentavos(aporte.monto),
    0,
  );

  const objetivoCentavos = aCentavos(meta.monto_objetivo);
  const restanteCentavos = Math.max(0, objetivoCentavos - totalCentavos);

  const progreso = objetivoCentavos > 0
    ? Number(((totalCentavos / objetivoCentavos) * 100).toFixed(2))
    : 0;

  return serializar({
    ...meta,
    monto_ahorrado: desdeCentavos(totalCentavos),
    monto_restante: desdeCentavos(restanteCentavos),
    progreso_pct: Math.min(progreso, 100),
    cantidad_aportes: meta.aporte_meta.length,
  });
}

async function obtenerMetaPropia(id: bigint, usuarioId: bigint) {
  const meta = await prisma.meta_ahorro.findFirst({
    where: {
      id_meta: id,
      id_usuario: usuarioId,
    },
    include: metaInclude,
  });

  if (!meta) {
    throw ApiError.notFound("Meta de ahorro no encontrada");
  }

  return meta;
}


async function obtenerMetaBloqueada(
  tx: Prisma.TransactionClient,
  id: bigint,
  usuarioId: bigint,
) {
  const filas = await tx.$queryRaw<Array<{ id_meta: bigint }>>`
    SELECT id_meta
    FROM meta_ahorro
    WHERE id_meta = ${id} AND id_usuario = ${usuarioId}
    FOR UPDATE
  `;

  if (filas.length === 0) {
    throw ApiError.notFound("Meta de ahorro no encontrada");
  }

  const meta = await tx.meta_ahorro.findFirst({
    where: {
      id_meta: id,
      id_usuario: usuarioId,
    },
    include: metaInclude,
  });

  if (!meta) {
    throw ApiError.notFound("Meta de ahorro no encontrada");
  }

  return meta;
}

async function obtenerEstado(nombre: string, db: Prisma.TransactionClient = prisma) {
  const estado = await db.estado_meta.findUnique({
    where: { nombre },
  });

  if (!estado) {
    throw ApiError.badRequest(
      `No está registrado el estado de meta: ${nombre}`,
    );
  }

  return estado;
}

async function actualizarEstadoAutomatico(
  tx: Prisma.TransactionClient,
  idMeta: bigint,
  usuarioId: bigint,
) {
  const meta = await tx.meta_ahorro.findFirst({
    where: {
      id_meta: idMeta,
      id_usuario: usuarioId,
    },
    include: {
      estado_meta: true,
      aporte_meta: {
        select: { monto: true },
      },
    },
  });

  if (!meta) {
    throw ApiError.notFound("Meta de ahorro no encontrada");
  }

  if (
    meta.estado_meta.nombre === "Cancelada" ||
    meta.estado_meta.nombre === "Completada"
  ) {
    return;
  }

  const totalCentavos = meta.aporte_meta.reduce(
    (total, aporte) => total + aCentavos(aporte.monto),
    0,
  );

  const objetivoCentavos = aCentavos(meta.monto_objetivo);
  const hoy = fechaActualUTC();
  const limite = meta.fecha_limite.toISOString().slice(0, 10);

  let nombreEstado = "Activa";

  if (totalCentavos >= objetivoCentavos) {
    nombreEstado = "Completada";
  } else if (limite < hoy) {
    nombreEstado = "Vencida";
  }

  if (meta.estado_meta.nombre !== nombreEstado) {
    const estado = nombreEstado === "Vencida"
      ? await tx.estado_meta.findUnique({ where: { nombre: nombreEstado } })
      : await obtenerEstado(nombreEstado, tx);
    if (!estado) return;

    await tx.meta_ahorro.update({
      where: { id_meta: idMeta, id_usuario: usuarioId },
      data: { id_estado_meta: estado.id_estado_meta },
    });

    if (nombreEstado === "Completada") {
      await generarAlertaMetaCompletada(
        usuarioId,
        idMeta,
        meta.nombre,
        tx,
      );
    }
  }
}

function validarMetaEditable(nombreEstado: string) {
  if (nombreEstado === "Cancelada") {
    throw ApiError.conflict(
      "No se puede modificar una meta cancelada",
    );
  }

  if (nombreEstado === "Completada") {
    throw ApiError.conflict(
      "No se puede modificar una meta completada",
    );
  }
}

export async function listarMetasAhorro(
  usuarioId: bigint,
  filtros: {
    page: number;
    limit: number;
    id_estado_meta?: number;
  },
) {
  const where = {
    id_usuario: usuarioId,
    ...(filtros.id_estado_meta !== undefined
      ? { id_estado_meta: filtros.id_estado_meta }
      : {}),
  };

  const [metas, total] = await Promise.all([
    prisma.meta_ahorro.findMany({
      where,
      include: metaInclude,
      orderBy: [
        { fecha_creacion: "desc" },
        { id_meta: "desc" },
      ],
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.meta_ahorro.count({ where }),
  ]);

  return {
    metas: metas.map(presentarMeta),
    paginacion: {
      pagina: filtros.page,
      limite: filtros.limit,
      total,
      totalPaginas: Math.ceil(total / filtros.limit),
    },
  };
}

export async function obtenerMetaAhorro(
  id: bigint,
  usuarioId: bigint,
) {
  const meta = await obtenerMetaPropia(id, usuarioId);
  return presentarMeta(meta);
}

export async function crearMetaAhorro(
  usuarioId: bigint,
  data: {
    nombre: string;
    descripcion?: string | null;
    monto_objetivo: number;
    fecha_inicio: string;
    fecha_limite: string;
  },
) {
  const idMeta = await prisma.$transaction(async (tx) => {
    const estado = await obtenerEstado("Activa", tx);
    const meta = await tx.meta_ahorro.create({
      data: {
        id_usuario: usuarioId,
        id_estado_meta: estado.id_estado_meta,
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        monto_objetivo: desdeCentavos(aCentavos(data.monto_objetivo)),
        fecha_inicio: fechaUTC(data.fecha_inicio),
        fecha_limite: fechaUTC(data.fecha_limite),
        fecha_creacion: new Date(),
      },
      include: metaInclude,
    });

    await actualizarEstadoAutomatico(tx, meta.id_meta, usuarioId);
    return meta.id_meta;
  });

  return obtenerMetaAhorro(idMeta, usuarioId);
}

export async function actualizarMetaAhorro(
  id: bigint,
  usuarioId: bigint,
  data: {
    nombre?: string;
    descripcion?: string | null;
    monto_objetivo?: number;
    fecha_inicio?: string;
    fecha_limite?: string;
  },
) {
  await prisma.$transaction(async (tx) => {
    const meta = await obtenerMetaBloqueada(tx, id, usuarioId);

    validarMetaEditable(meta.estado_meta.nombre);

    const fechaInicio = data.fecha_inicio
      ? fechaUTC(data.fecha_inicio)
      : meta.fecha_inicio;

    const fechaLimite = data.fecha_limite
      ? fechaUTC(data.fecha_limite)
      : meta.fecha_limite;

    if (fechaLimite < fechaInicio) {
      throw ApiError.badRequest(
        "La fecha límite debe ser igual o posterior a la fecha de inicio",
      );
    }

    if (meta.aporte_meta.some((aporte) => aporte.fecha_aporte < fechaInicio || aporte.fecha_aporte > fechaLimite)) {
      throw ApiError.badRequest("El período debe incluir los aportes existentes");
    }

    const totalCentavos = meta.aporte_meta.reduce(
      (total, aporte) => total + aCentavos(aporte.monto),
      0,
    );

    const nuevoObjetivo = data.monto_objetivo !== undefined
      ? aCentavos(data.monto_objetivo)
      : aCentavos(meta.monto_objetivo);

    if (nuevoObjetivo < totalCentavos) {
      throw ApiError.badRequest(
        "El objetivo no puede ser menor al total de los aportes registrados",
      );
    }

    await tx.meta_ahorro.update({
      where: { id_meta: id, id_usuario: usuarioId },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.descripcion !== undefined
          ? { descripcion: data.descripcion }
          : {}),
        ...(data.monto_objetivo !== undefined
          ? { monto_objetivo: desdeCentavos(nuevoObjetivo) }
          : {}),
        ...(data.fecha_inicio !== undefined
          ? { fecha_inicio: fechaInicio }
          : {}),
        ...(data.fecha_limite !== undefined
          ? { fecha_limite: fechaLimite }
          : {}),
      },
    });

    await actualizarEstadoAutomatico(tx, id, usuarioId);
  });

  return obtenerMetaAhorro(id, usuarioId);
}

export async function eliminarMetaAhorro(
  id: bigint,
  usuarioId: bigint,
) {
  const meta = await obtenerMetaPropia(id, usuarioId);

  if (meta.aporte_meta.length > 0) {
    throw ApiError.conflict(
      "No se puede eliminar la meta porque tiene aportes registrados. Elimina primero sus aportes.",
    );
  }

  const alertas = await prisma.alerta.count({
    where: {
      id_meta: id,
      id_usuario: usuarioId,
    },
  });

  if (alertas > 0) {
    throw ApiError.conflict(
      "No se puede eliminar la meta porque tiene alertas relacionadas",
    );
  }

  await prisma.meta_ahorro.delete({
    where: { id_meta: id, id_usuario: usuarioId },
  });

  return { mensaje: "Meta de ahorro eliminada correctamente" };
}

export async function cancelarMetaAhorro(
  id: bigint,
  usuarioId: bigint,
) {
  await prisma.$transaction(async (tx) => {
    const meta = await obtenerMetaBloqueada(tx, id, usuarioId);

    if (meta.estado_meta.nombre === "Completada") {
      throw ApiError.conflict(
        "No se puede cancelar una meta completada",
      );
    }

    if (meta.estado_meta.nombre === "Cancelada") {
      throw ApiError.conflict("La meta ya está cancelada");
    }

    const estado = await obtenerEstado("Cancelada", tx);

    await tx.meta_ahorro.update({
      where: { id_meta: id, id_usuario: usuarioId },
      data: { id_estado_meta: estado.id_estado_meta },
    });
  });

  return obtenerMetaAhorro(id, usuarioId);
}

export async function listarAportesMeta(
  id: bigint,
  usuarioId: bigint,
) {
  const meta = await obtenerMetaPropia(id, usuarioId);

  const totalCentavos = meta.aporte_meta.reduce(
    (total, aporte) => total + aCentavos(aporte.monto),
    0,
  );

  return serializar({
    aportes: meta.aporte_meta,
    resumen: {
      cantidad_aportes: meta.aporte_meta.length,
      monto_ahorrado: desdeCentavos(totalCentavos),
      monto_objetivo: Number(meta.monto_objetivo),
      monto_restante: desdeCentavos(
        Math.max(0, aCentavos(meta.monto_objetivo) - totalCentavos),
      ),
    },
  });
}


function validarFechaAporte(fecha: Date, meta: { fecha_inicio: Date; fecha_limite: Date }) {
  if (fecha < meta.fecha_inicio || fecha > meta.fecha_limite) {
    throw ApiError.badRequest("La fecha del aporte debe estar dentro del período de la meta");
  }
}

export async function crearAporteMeta(
  id: bigint,
  usuarioId: bigint,
  data: {
    monto: number;
    fecha_aporte: string;
    nota?: string | null;
  },
) {
  const nuevoMontoCentavos = aCentavos(data.monto);

  const aporte = await prisma.$transaction(async (tx) => {
    const meta = await obtenerMetaBloqueada(tx, id, usuarioId);

    validarMetaEditable(meta.estado_meta.nombre);

    const totalCentavos = meta.aporte_meta.reduce(
      (total, item) => total + aCentavos(item.monto),
      0,
    );

    const objetivoCentavos = aCentavos(meta.monto_objetivo);

    if (totalCentavos + nuevoMontoCentavos > objetivoCentavos) {
      throw ApiError.badRequest(
        "El aporte supera el monto restante de la meta",
      );
    }

    const fecha = fechaUTC(data.fecha_aporte);
    validarFechaAporte(fecha, meta);

    const creado = await tx.aporte_meta.create({
      data: {
        id_meta: id,
        monto: desdeCentavos(nuevoMontoCentavos),
        fecha_aporte: fecha,
        nota: data.nota ?? null,
      },
    });
    await actualizarEstadoAutomatico(tx, id, usuarioId);
    return creado;
  });

  return serializar(aporte);
}


export async function actualizarAporteMeta(
  id: bigint,
  idAporte: bigint,
  usuarioId: bigint,
  data: {
    monto?: number;
    fecha_aporte?: string;
    nota?: string | null;
  },
) {
  const actualizado = await prisma.$transaction(async (tx) => {
    const meta = await obtenerMetaBloqueada(tx, id, usuarioId);

    validarMetaEditable(meta.estado_meta.nombre);

    const aporte = await tx.aporte_meta.findFirst({
      where: {
        id_aporte: idAporte,
        id_meta: id,
        meta_ahorro: { id_usuario: usuarioId },
      },
    });

    if (!aporte) {
      throw ApiError.notFound("Aporte no encontrado");
    }

    const totalActual = meta.aporte_meta.reduce(
      (total, item) => total + aCentavos(item.monto),
      0,
    );

    const totalSinAporte = totalActual - aCentavos(aporte.monto);
    const nuevoMonto = data.monto !== undefined
      ? aCentavos(data.monto)
      : aCentavos(aporte.monto);

    if (totalSinAporte + nuevoMonto > aCentavos(meta.monto_objetivo)) {
      throw ApiError.badRequest(
        "El aporte actualizado supera el monto restante de la meta",
      );
    }

    const fecha = data.fecha_aporte === undefined ? undefined : fechaUTC(data.fecha_aporte);
    if (fecha) validarFechaAporte(fecha, meta);

    const resultado = await tx.aporte_meta.update({
      where: { id_aporte: idAporte, id_meta: id, meta_ahorro: { id_usuario: usuarioId } },
      data: {
        ...(data.monto !== undefined
          ? { monto: desdeCentavos(nuevoMonto) }
          : {}),
        ...(data.fecha_aporte !== undefined
          ? { fecha_aporte: fecha }
          : {}),
        ...(data.nota !== undefined ? { nota: data.nota } : {}),
      },
    });
    await actualizarEstadoAutomatico(tx, id, usuarioId);
    return resultado;
  });

  return serializar(actualizado);
}


export async function eliminarAporteMeta(
  id: bigint,
  idAporte: bigint,
  usuarioId: bigint,
) {
  await prisma.$transaction(async (tx) => {
    const meta = await obtenerMetaBloqueada(tx, id, usuarioId);

    validarMetaEditable(meta.estado_meta.nombre);

    const aporte = await tx.aporte_meta.findFirst({
      where: {
        id_aporte: idAporte,
        id_meta: id,
        meta_ahorro: { id_usuario: usuarioId },
      },
    });

    if (!aporte) {
      throw ApiError.notFound("Aporte no encontrado");
    }

    await tx.aporte_meta.delete({
      where: { id_aporte: idAporte, id_meta: id, meta_ahorro: { id_usuario: usuarioId } },
    });
    await actualizarEstadoAutomatico(tx, id, usuarioId);
  });

  return { mensaje: "Aporte eliminado correctamente" };
}

export async function obtenerAporteMeta(idMeta: bigint, idAporte: bigint, usuarioId: bigint) {
  const aporte = await prisma.aporte_meta.findFirst({
    where: { id_aporte: idAporte, id_meta: idMeta, meta_ahorro: { id_usuario: usuarioId } },
  });
  if (!aporte) throw ApiError.notFound("Aporte no encontrado");
  return serializar(aporte);
}
