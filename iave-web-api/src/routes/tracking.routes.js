import { Router } from "express";
import {
  getTrackingStatus,
  getMunicipalityProxy,
  getActiveOperators,
  getOTTrackingDetails
} from "../controllers/tracking.controllers.js";

const router = Router();

// Obtener estatus de rastreo para lista de matrículas
router.post("/status", getTrackingStatus);

// Proxy para obtener municipio (Geocodificación Inversa)
router.get("/municipality", getMunicipalityProxy);

// Obtener lista de compañero operador vigentes
router.get("/operadores", getActiveOperators);
// Obtener detalles de una OT (status de rastreo y coordenadas)
router.get("/ot/:otId", getOTTrackingDetails);
export default router;