import { asyncHandler } from "../middlewares/async-handler";
import * as servicio from "../services/compra_impulsiva.service";
import type { Crear, Actualizar } from "../schemas/compra_impulsiva.schema";
import type { Paginacion } from "../schemas/recurso.schema";

export const listar = asyncHandler(async (req, res) => {
  const params = req.validated!.params as { parentId?: bigint };
  res.json({ success: true, data: await servicio.listar(req.usuario!.id_usuario, req.validated!.query as Paginacion, params.parentId) });
});
export const obtener = asyncHandler(async (req, res) => {
  const params = req.validated!.params as { id: bigint; parentId?: bigint };
  res.json({ success: true, data: await servicio.obtener(req.usuario!.id_usuario, params.id, params.parentId) });
});
export const crear = asyncHandler(async (req, res) => {
  const params = req.validated!.params as { parentId?: bigint };
  res.status(201).json({ success: true, data: await servicio.crear(req.usuario!.id_usuario, req.validated!.body as Crear, params.parentId) });
});
export const actualizar = asyncHandler(async (req, res) => {
  const params = req.validated!.params as { id: bigint; parentId?: bigint };
  res.json({ success: true, data: await servicio.actualizar(req.usuario!.id_usuario, params.id, req.validated!.body as Actualizar, params.parentId) });
});
export const eliminar = asyncHandler(async (req, res) => {
  const params = req.validated!.params as { id: bigint; parentId?: bigint };
  await servicio.eliminar(req.usuario!.id_usuario, params.id, params.parentId);
  res.status(204).send();
});
