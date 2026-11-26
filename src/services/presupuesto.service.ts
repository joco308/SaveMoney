import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";
import { escribir, validarCategoria, validarEmprendimiento } from "./operacion.service";

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

async function verificarPresupuesto(id: bigint, id_usuario: bigint) {
  const presupuesto = await prisma.presupuesto.findFirst({ where: { id_presupuesto: id, id_usuario } });
  if (!presupuesto) throw ApiError.notFound("Presupuesto no encontrado");
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
  const presupuesto = await escribir(async (tx) => {
    await validarEmprendimiento(tx, data.id_emprendimiento, usuarioId);
    return tx.presupuesto.create({
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
  const presupuesto = await escribir(async (tx) => {
    const where = { id_presupuesto: id, id_usuario: usuarioId };
    const actual = await tx.presupuesto.findFirst({ where });
    if (!actual) throw ApiError.notFound("Presupuesto no encontrado");

    if (data.id_emprendimiento !== undefined) {
      await validarEmprendimiento(tx, data.id_emprendimiento, usuarioId);
    }

    if (data.monto_total !== undefined) {
      const limite = await tx.presupuesto_categoria.findFirst({
        where: { id_presupuesto: id, presupuesto: { id_usuario: usuarioId }, monto_limite: { gt: data.monto_total } },
      });
      if (limite) throw ApiError.badRequest("El presupuesto no puede ser inferior a sus límites");
    }

    return tx.presupuesto.update({ where, data, include: presupuestoInclude });
  });

  return serializar(presupuesto);
}

export async function eliminarPresupuesto(
  id: bigint,
  usuarioId: bigint,
) {
  await escribir(async (tx) => {
    await tx.presupuesto.delete({ where: { id_presupuesto: id, id_usuario: usuarioId } });
  });

  return { mensaje: "Presupuesto eliminado correctamente" };
}

export async function listarLimites(idPresupuesto: bigint, id_usuario: bigint, page: number, limit: number) {
  await verificarPresupuesto(idPresupuesto, id_usuario);
  const where = { id_presupuesto: idPresupuesto, presupuesto: { id_usuario } };
  const [registros, total] = await prisma.$transaction([
    prisma.presupuesto_categoria.findMany({
      where,
      orderBy: { id_limite: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { categoria: true },
    }),
    prisma.presupuesto_categoria.count({ where }),
  ], { isolationLevel: "RepeatableRead" });
  return { registros, paginacion: { pagina: page, limite: limit, total, totalPaginas: Math.ceil(total / limit) } };
}

export async function obtenerLimite(idPresupuesto: bigint, idLimite: bigint, id_usuario: bigint) {
  const limite = await prisma.presupuesto_categoria.findFirst({
    where: { id_presupuesto: idPresupuesto, id_limite: idLimite, presupuesto: { id_usuario } },
    include: { categoria: true },
  });
  if (!limite) throw ApiError.notFound("Límite de categoría no encontrado");
  return limite;
}

export async function agregarLimiteCategoria(
  idPresupuesto: bigint,
  id_usuario: bigint,
  data: { id_categoria: number; monto_limite: number; umbral_alerta_pct: number },
) {
  return editarLimite(idPresupuesto, id_usuario, data);
}

export async function actualizarLimiteCategoria(
  idPresupuesto: bigint,
  idLimite: bigint,
  id_usuario: bigint,
  data: { id_categoria?: number; monto_limite?: number; umbral_alerta_pct?: number },
) {
  return editarLimite(idPresupuesto, id_usuario, data, idLimite);
}

async function editarLimite(
  idPresupuesto: bigint,
  id_usuario: bigint,
  data: { id_categoria?: number; monto_limite?: number; umbral_alerta_pct?: number },
  idLimite?: bigint,
) {
  return escribir(async (tx) => {
    const presupuesto = await tx.presupuesto.findFirst({
      where: { id_presupuesto: idPresupuesto, id_usuario },
    });
    if (!presupuesto) throw ApiError.notFound("Presupuesto no encontrado");

    const where = { id_presupuesto: idPresupuesto, presupuesto: { id_usuario } };
    if (idLimite !== undefined && !await tx.presupuesto_categoria.findFirst({ where: { ...where, id_limite: idLimite } })) {
      throw ApiError.notFound("Límite de categoría no encontrado");
    }

    if (data.monto_limite !== undefined && presupuesto.monto_total.lessThan(data.monto_limite)) {
      throw ApiError.badRequest("El límite supera el presupuesto total");
    }

    if (data.id_categoria !== undefined) {
      await validarCategoria(tx, data.id_categoria, id_usuario);
      const duplicado = await tx.presupuesto_categoria.findFirst({
        where: { ...where, id_categoria: data.id_categoria, ...(idLimite === undefined ? {} : { id_limite: { not: idLimite } }) },
      });
      if (duplicado) throw ApiError.conflict("La categoría ya tiene un límite en este presupuesto");
    }

    const include = { categoria: true };
    if (idLimite !== undefined) {
      return tx.presupuesto_categoria.update({ where: { ...where, id_limite: idLimite }, data, include });
    }

    const { id_categoria, monto_limite, umbral_alerta_pct } = data;
    if (id_categoria === undefined || monto_limite === undefined || umbral_alerta_pct === undefined) {
      throw ApiError.badRequest("Faltan los datos del límite");
    }

    return tx.presupuesto_categoria.create({
      data: { id_presupuesto: idPresupuesto, id_categoria, monto_limite, umbral_alerta_pct },
      include,
    });
  });
}

export async function eliminarLimiteCategoria(idPresupuesto: bigint, idLimite: bigint, id_usuario: bigint) {
  await escribir(async (tx) => {
    await tx.presupuesto_categoria.delete({
      where: { id_limite: idLimite, id_presupuesto: idPresupuesto, presupuesto: { id_usuario } },
    });
  });

  return { mensaje: "Límite de categoría eliminado correctamente" };
}
