import { Router } from "express";
import {
  getTags,
  getStatsTags,
  getTotalStatsTags,
  generarResponsivaDesdePlantilla,
  getUnavailableOps



} from "../controllers/tags.controllers.js";



const router = Router();

// Se obtienen todos los cruces
router.get("/", getTags);
router.get("/stats", getStatsTags);
router.get("/TotalStatsTags", getTotalStatsTags);
router.get("/:fechaBuscada/unavailableOPs", getUnavailableOps)
router.post("/exportar-responsiva", generarResponsivaDesdePlantilla);

export default router;