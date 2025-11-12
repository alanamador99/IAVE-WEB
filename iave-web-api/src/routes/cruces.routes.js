import { Router } from "express";
import {
  getCruces,
  actualizarEstatusCruce,
  getStats,
  getOTS, getConciliacion,
  getStatusPersonal,
  importCruces,
  setOTSbyIDCruce,
  getCasetaMatch,
  getImportProgress,
  actualizarOTMasivo,
  actualizarEstatusMasivoCruces
} from "../controllers/cruces.controllers.js";



const router = Router();


router.get("/", getCruces);
router.get("/stats", getStats);
router.get('/progress', getImportProgress);
router.get("/statusPersonal/:ID_Cruce", getStatusPersonal);
router.get("/OTS", getOTS);
router.get("/Conciliacion", getConciliacion);
router.post("/importar", importCruces);
router.patch('/:id/estatus', actualizarEstatusCruce);
router.patch('/:id/setOT', setOTSbyIDCruce);

router.patch('/masivo-estatus', actualizarEstatusMasivoCruces);


//Ruta de prueba
router.get("/caseta/:CasetaNCruce", getCasetaMatch);



export default router;