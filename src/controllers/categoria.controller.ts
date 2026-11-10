import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middlewares/async-handler";
import {
  categoriaIdSchema,
  listarCategoriasSchema,
  crearCategoriaSchema,
  actualizarCategoriaSchema,
  cambiarEstadoCategoriaSchema,
} from "../schemas/categoria.schema";
import * as categoriaService from "../services/categoria.service";

export const listarCategoriasController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listarCategoriasSchema.parse(req.validated?.query);
    const usuarioId = req.usuario!.id_usuario;

    const resultado = await categoriaService.listarCategorias(
      usuarioId,
      query.page,
      query.limit,
      query.id_tipo_categoria,
    );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);

export const obtenerCategoriaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = categoriaIdSchema.parse(req.validated?.params);
    const usuarioId = req.usuario!.id_usuario;

    const categoria = await categoriaService.obtenerCategoria(
      params.id,
      usuarioId,
    );

    res.status(200).json({
      success: true,
      data: categoria,
    });
  },
);

export const crearCategoriaController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = crearCategoriaSchema.parse(req.validated?.body);
    const usuarioId = req.usuario!.id_usuario;

    const categoria = await categoriaService.crearCategoria(
      usuarioId,
      data,
    );

    res.status(201).json({
      success: true,
      data: categoria,
    });
  },
);

export const actualizarCategoriaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = categoriaIdSchema.parse(req.validated?.params);
    const data = actualizarCategoriaSchema.parse(req.validated?.body);
    const usuarioId = req.usuario!.id_usuario;

    const categoria = await categoriaService.actualizarCategoria(
      params.id,
      usuarioId,
      data,
    );

    res.status(200).json({
      success: true,
      data: categoria,
    });
  },
);

export const cambiarEstadoCategoriaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = categoriaIdSchema.parse(req.validated?.params);
    const data = cambiarEstadoCategoriaSchema.parse(req.validated?.body);
    const usuarioId = req.usuario!.id_usuario;

    const categoria = await categoriaService.cambiarEstadoCategoria(
      params.id,
      usuarioId,
      data.activa,
    );

    res.status(200).json({
      success: true,
      data: categoria,
    });
  },
);

export const eliminarCategoriaController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = categoriaIdSchema.parse(req.validated?.params);
    const usuarioId = req.usuario!.id_usuario;

    const resultado = await categoriaService.eliminarCategoria(
      params.id,
      usuarioId,
    );

    res.status(200).json({
      success: true,
      data: resultado,
    });
  },
);
