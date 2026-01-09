import { Router } from "express";
import {
  getCasetas,
  getRutasTUSA_TRN,
  getCasetas_por_RutaTUSA_TRN,
  getCoordenadasOrigenDestino,
  getNombresOrigenDestino,
  getRutaPorOrigen_Destino,
  getStatsCasetas,
  getCasetasByID,
  getCasetasDetails,
  getCoincidenciasPoblacion,
  getNearDirectorios,
  setCasetasByID,
  GuardarCambiosEnRuta,
  getCasetaFromInegi
} from "../controllers/casetas.controllers.js";

const router = Router();

router.get("/", getCasetas);
router.get("/rutas/", getRutasTUSA_TRN);
router.get("/rutas/:IDTipoRuta/casetasPorRuta", getCasetas_por_RutaTUSA_TRN);
router.get("/rutas/:IDTipoRuta/CoordenadasOrigenDestino", getCoordenadasOrigenDestino);
router.get("/rutas/:IDTipoRuta/NombresOrigenDestino", getNombresOrigenDestino);
router.post("/rutas/BuscarRutaPorOrigen_Destino", getRutaPorOrigen_Destino);
router.get("/stats", getStatsCasetas);
router.get("/:id", getCasetasByID);
router.get("/cas/:id", getCasetasDetails);
router.get("/rutas/:Poblacion/RutasConCoincidencia", getCoincidenciasPoblacion);
router.get("/rutas/near-directorio", getNearDirectorios);
router.patch("/:id", setCasetasByID);
router.post("/rutas/guardar-cambios", GuardarCambiosEnRuta);
router.post("/casetaINEGI", getCasetaFromInegi);

export default router;