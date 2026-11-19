import { asyncHandler } from "../middlewares/async-handler";
import { obtenerCatalogos } from "../services/catalogo.service";
export const obtener = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await obtenerCatalogos() });
});
