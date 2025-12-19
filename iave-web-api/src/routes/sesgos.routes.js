import { Router } from "express";
import {
  getSesgosPorCasetas,
  getSesgosByOT,
  getStats,
  UpdateSesgo,
  getSesgos, getNearDirectorios
} from "../controllers/sesgos.controllers.js";


const router = Router();

router.get("/stats", getStats);
router.get("/near-directorio", getNearDirectorios);
router.get("/rutas", getSesgosPorCasetas);
router.get("/:IDOrden/OT", getSesgosByOT);
// Se actualiza el estatus de un cruce, se envía el status mediante el body y el ID_Cruce por params
router.patch('/:id/UpdateSesgo', UpdateSesgo);
router.get("/", getSesgos);






export default router;