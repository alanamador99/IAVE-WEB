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
router.post("/exportar-responsiva", generarResponsivaDesdePlantilla);
router.get("/:fechaBuscada/unavailableOPs", getUnavailableOps)

export default router;