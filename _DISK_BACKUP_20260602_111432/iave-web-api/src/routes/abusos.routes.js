import { Router } from "express";
import {
  getAbusos,
  actualizarComentarioAbuso,
  getAbusosAgrupados,
  getStatsAbusos,
  getAbusosByOperador,
  getUbicacionesinADayByOperador,
  actualizarEstatusMasivo,
  UpdateAbuso

} from "../controllers/abusos.controllers.js";


const router = Router();

router.get("/", getAbusos);
router.get("/:operador/abusosByOP", getAbusosByOperador);
router.get("/Ubicaciones/:IDCruce", getUbicacionesinADayByOperador)
router.get("/getAbusosGrouped", getAbusosAgrupados);

router.patch('/:id/UpdateAbuso', UpdateAbuso);
router.patch("/:ID/comentario", actualizarComentarioAbuso);
router.patch("/estatus-masivo", actualizarEstatusMasivo);


router.get("/stats", getStatsAbusos);


export default router;