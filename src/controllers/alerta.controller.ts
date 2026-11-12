import { asyncHandler } from "../middlewares/async-handler";
import * as servicio from "../services/alerta.service";
import type { Paginacion } from "../schemas/recurso.schema";
export const listar = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await servicio.listar(req.usuario!.id_usuario, req.validated!.query as Paginacion) });
});
export const obtener = asyncHandler(async (req, res) => {
  const { id } = req.validated!.params as { id: bigint };
  res.json({ success: true, data: await servicio.obtener(req.usuario!.id_usuario, id) });
});
export const marcarLectura = asyncHandler(async (req, res) => {
  const { id } = req.validated!.params as { id: bigint };
  const { leida } = req.validated!.body as { leida: boolean };
  res.json({ success: true, data: await servicio.marcarLectura(req.usuario!.id_usuario, id, leida) });
});
export const eliminar = asyncHandler(async (req, res) => {
  const { id } = req.validated!.params as { id: bigint };
  await servicio.eliminar(req.usuario!.id_usuario, id);
  res.status(204).send();
});
