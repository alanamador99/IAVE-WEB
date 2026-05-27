import { Router } from "express";
import {
  getCasetas,
  getRutasTUSA_TRN,
  getCasetas_por_RutaTUSA_TRN,
  crearNuevaRutaTUSA,
  getCoordenadasOrigenDestino,
  getNombresOrigenDestino,
  getRutaPorOrigen_Destino,
  getStatsCasetas,
  getCasetasDetails,
  getCoincidenciasPoblacion,
  getNearDirectorios,
  updateCasetaByID,
  GuardarCambiosEnRuta,
  getCasetaFromInegi,
  getCasetasTUSACoincidentes,
  getCasetaByID,
  searchCasetas,
  // Linked PASE
  searchPaseCasetas,
  updatePaseID,
  getCatEntidadCasetas,
  getPaseTarifas,
  getAnalisisCostosRutas,
  getAnalisisHistoricoRutas,
  getRutasCombustible2025,
  getOxxoStations
} from "../controllers/casetas.controllers.js";

const router = Router();

router.get("/", getCasetas);
router.get("/search", searchCasetas);
router.get("/pase/cat-entidad", getCatEntidadCasetas);
router.get("/pase/search", searchPaseCasetas);
router.get("/pase/:id/tarifas", getPaseTarifas);
router.patch("/pase/:id/update-id", updatePaseID);

router.get("/:IDcaseta/getCasetaByID", getCasetaByID);
router.get("/rutas/", getRutasTUSA_TRN);
router.get("/rutas/:IDTipoRuta/casetasPorRuta", getCasetas_por_RutaTUSA_TRN);
router.get("/rutas/:IDTipoRuta/CoordenadasOrigenDestino", getCoordenadasOrigenDestino);
router.get("/rutas/:IDTipoRuta/NombresOrigenDestino", getNombresOrigenDestino);
router.post("/rutas/BuscarRutaPorOrigen_Destino", getRutaPorOrigen_Destino);
router.get("/stats", getStatsCasetas);
router.get("/cas/:id", getCasetasDetails);
router.get("/rutas/:Poblacion/RutasConCoincidencia", getCoincidenciasPoblacion);
router.get("/rutas/near-directorio", getNearDirectorios);
router.patch("/updateCasetaByID", updateCasetaByID);
router.post("/rutas/guardar-cambios", GuardarCambiosEnRuta);
router.post("/casetaINEGI", getCasetaFromInegi);
router.post("/rutas/crear-nueva-ruta", crearNuevaRutaTUSA);
router.post("/rutas/casetas-tusa-coincidentes", getCasetasTUSACoincidentes);
router.get("/analisis/costos-rutas", getAnalisisCostosRutas);
router.get("/analisis/historico-rutas", getAnalisisHistoricoRutas);
router.get("/analisis/combustible-2025", getRutasCombustible2025);
router.get("/analisis/oxxo-stations", getOxxoStations);

export default router;