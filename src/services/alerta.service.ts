import { prisma } from "../config/prisma";
import { ApiError } from "../types/api-error";

function serializar<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  ) as T;
}

const alertaInclude = {
  tipo_alerta: true,
};

export async function listarAlertas(
  usuarioId: bigint,
  filtros: {
    page: number;
    limit: number;
    leida?: "true" | "false";
  },
) {
  const where = {
    id_usuario: usuarioId,
    ...(filtros.leida === "true"
      ? { fecha_lectura: { not: null } }
      : filtros.leida === "false"
        ? { fecha_lectura: null }
        : {}),
  };

  const [alertas, total, totalGeneral, noLeidas] = await Promise.all([
    prisma.alerta.findMany({
      where,
      include: alertaInclude,
      orderBy: [
        { fecha_generacion: "desc" },
        { id_alerta: "desc" },
      ],
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.alerta.count({ where }),
    prisma.alerta.count({
      where: { id_usuario: usuarioId },
    }),
    prisma.alerta.count({
      where: {
        id_usuario: usuarioId,
        fecha_lectura: null,
      },
    }),
  ]);

  return {
    alertas: serializar(alertas),
    resumen: {
      total: totalGeneral,
      no_leidas: noLeidas,
      leidas: totalGeneral - noLeidas,
      resultados_filtrados: total,
    },
    paginacion: {
      pagina: filtros.page,
      limite: filtros.limit,
      total,
      totalPaginas: Math.ceil(total / filtros.limit),
    },
  };
}

export async function obtenerAlerta(
  id: bigint,
  usuarioId: bigint,
) {
  const alerta = await prisma.alerta.findFirst({
    where: {
      id_alerta: id,
      id_usuario: usuarioId,
    },
    include: alertaInclude,
  });

  if (!alerta) {
    throw ApiError.notFound("Alerta no encontrada");
  }

  return serializar(alerta);
}

export async function marcarAlertaLeida(
  id: bigint,
  usuarioId: bigint,
) {
  const alerta = await prisma.alerta.findFirst({
    where: {
      id_alerta: id,
      id_usuario: usuarioId,
    },
  });

  if (!alerta) {
    throw ApiError.notFound("Alerta no encontrada");
  }

  const actualizada = await prisma.alerta.update({
    where: { id_alerta: id },
    data: {
      fecha_lectura: alerta.fecha_lectura ?? new Date(),
    },
    include: alertaInclude,
  });

  return serializar(actualizada);
}

export async function marcarTodasLeidas(usuarioId: bigint) {
  const resultado = await prisma.alerta.updateMany({
    where: {
      id_usuario: usuarioId,
      fecha_lectura: null,
    },
    data: {
      fecha_lectura: new Date(),
    },
  });

  return {
    mensaje: "Alertas marcadas como leídas",
    cantidad_actualizada: resultado.count,
  };
}

export async function eliminarAlerta(
  id: bigint,
  usuarioId: bigint,
) {
  const alerta = await prisma.alerta.findFirst({
    where: {
      id_alerta: id,
      id_usuario: usuarioId,
    },
  });

  if (!alerta) {
    throw ApiError.notFound("Alerta no encontrada");
  }

  await prisma.alerta.delete({
    where: { id_alerta: id },
  });

  return {
    mensaje: "Alerta eliminada correctamente",
  };
}

/**
 * Evalúa los presupuestos y límites de categoría después
 * de registrar o actualizar un movimiento.
 *
 * Tipos:
 * 1 = PRESUPUESTO_UMBRAL
 * 2 = LIMITE_CATEGORIA_UMBRAL
 */
export async function evaluarAlertasPresupuesto(
  usuarioId: bigint,
  fechaMovimiento: Date,
  idEmprendimiento: bigint | null,
) {
  const anio = fechaMovimiento.getUTCFullYear();
  const mes = fechaMovimiento.getUTCMonth();

  const inicioMes = new Date(Date.UTC(anio, mes, 1));
  const finMes = new Date(Date.UTC(anio, mes + 1, 1));

  const presupuestos = await prisma.presupuesto.findMany({
    where: {
      id_usuario: usuarioId,
      anio,
      mes: mes + 1,
      id_emprendimiento: idEmprendimiento,
    },
    include: {
      presupuesto_categoria: {
        include: {
          categoria: true,
        },
      },
    },
  });

  if (presupuestos.length === 0) return;

  const movimientos = await prisma.movimiento.findMany({
    where: {
      id_usuario: usuarioId,
      id_emprendimiento: idEmprendimiento,
      fecha_movimiento: {
        gte: inicioMes,
        lt: finMes,
      },
    },
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
  });

  const egresos = movimientos.filter(
    (movimiento) =>
      movimiento.categoria.tipo_categoria.tipo_movimiento.nombre ===
      "Egreso",
  );

  const centavos = (valor: unknown) =>
    Math.round(Number(valor) * 100);

  const totalEgresos = egresos.reduce(
    (total, movimiento) => total + centavos(movimiento.monto),
    0,
  );

  for (const presupuesto of presupuestos) {
    const montoPresupuesto = centavos(presupuesto.monto_total);

    if (montoPresupuesto > 0) {
      const porcentaje =
        (totalEgresos / montoPresupuesto) * 100;

      if (porcentaje >= presupuesto.umbral_alerta_pct) {
        const existente = await prisma.alerta.findFirst({
          where: {
            id_usuario: usuarioId,
            id_tipo_alerta: 1,
            id_presupuesto: presupuesto.id_presupuesto,
          },
        });

        if (!existente) {
          await prisma.alerta.create({
            data: {
              id_usuario: usuarioId,
              id_tipo_alerta: 1,
              id_presupuesto: presupuesto.id_presupuesto,
              mensaje:
                `Has utilizado el ${porcentaje.toFixed(2)}% ` +
                `de tu presupuesto mensual.`,
              fecha_generacion: new Date(),
            },
          });
        }
      }
    }

    for (const limite of presupuesto.presupuesto_categoria) {
      const totalCategoria = egresos
        .filter(
          (movimiento) =>
            movimiento.id_categoria === limite.id_categoria,
        )
        .reduce(
          (total, movimiento) =>
            total + centavos(movimiento.monto),
          0,
        );

      const montoLimite = centavos(limite.monto_limite);

      if (montoLimite <= 0) continue;

      const porcentaje =
        (totalCategoria / montoLimite) * 100;

      if (porcentaje >= limite.umbral_alerta_pct) {
        const existente = await prisma.alerta.findFirst({
          where: {
            id_usuario: usuarioId,
            id_tipo_alerta: 2,
            id_limite: limite.id_limite,
          },
        });

        if (!existente) {
          await prisma.alerta.create({
            data: {
              id_usuario: usuarioId,
              id_tipo_alerta: 2,
              id_limite: limite.id_limite,
              mensaje:
                `Has utilizado el ${porcentaje.toFixed(2)}% ` +
                `del límite de la categoría ` +
                `${limite.categoria.nombre}.`,
              fecha_generacion: new Date(),
            },
          });
        }
      }
    }
  }
}


/**
 * Genera una única alerta cuando una meta se completa.
 * Tipo 3 = META_COMPLETADA.
 */
export async function generarAlertaMetaCompletada(
  usuarioId: bigint,
  idMeta: bigint,
  nombreMeta: string,
) {
  const existente = await prisma.alerta.findFirst({
    where: {
      id_usuario: usuarioId,
      id_tipo_alerta: 3,
      id_meta: idMeta,
    },
  });

  if (existente) return;

  await prisma.alerta.create({
    data: {
      id_usuario: usuarioId,
      id_tipo_alerta: 3,
      id_meta: idMeta,
      mensaje: `¡Felicidades! Has completado tu meta de ahorro: ${nombreMeta}.`,
      fecha_generacion: new Date(),
    },
  });
}

/**
 * Genera alertas para compras cuyo período de espera terminó.
 * Solo considera compras que siguen En espera.
 * Tipo 4 = COMPRA_ESPERA_FINALIZADA.
 */
export async function evaluarAlertasComprasFinalizadas(
  usuarioId: bigint,
) {
  const compras = await prisma.compra_impulsiva.findMany({
    where: {
      id_usuario: usuarioId,
      id_estado_espera: 1,
      fecha_fin_espera: { lte: new Date() },
    },
    select: {
      id_compra_impulsiva: true,
      articulo: true,
    },
  });

  for (const compra of compras) {
    const existente = await prisma.alerta.findFirst({
      where: {
        id_usuario: usuarioId,
        id_tipo_alerta: 4,
        id_compra_impulsiva: compra.id_compra_impulsiva,
      },
    });

    if (!existente) {
      await prisma.alerta.create({
        data: {
          id_usuario: usuarioId,
          id_tipo_alerta: 4,
          id_compra_impulsiva: compra.id_compra_impulsiva,
          mensaje: `Terminó el período de espera de tu compra: ${compra.articulo}. Ahora puedes decidir si deseas realizarla.`,
          fecha_generacion: new Date(),
        },
      });
    }
  }
}
