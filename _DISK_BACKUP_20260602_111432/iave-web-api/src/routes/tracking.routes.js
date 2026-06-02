import { Router } from "express";
import {
  getTrackingStatus,
  getMunicipalityProxy,
  getActiveOperators
} from "../controllers/tracking.controllers.js";

const router = Router();

// Obtener estatus de rastreo para lista de matrículas
router.post("/status", getTrackingStatus);

// Proxy para obtener municipio (Geocodificación Inversa)
router.get("/municipality", getMunicipalityProxy);

// Obtener lista de compañero operador vigentes
router.get("/operadores", getActiveOperators);

export default router;