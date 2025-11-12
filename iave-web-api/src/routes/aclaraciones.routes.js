import { Router } from "express";
import {
  getAclaraciones,
  getAclaracionesByOT,
  getStats,
  UpdateAclaracion
  
  /* Descomentar
  createNewCruces,
  actualizarEstatusCruce
  getCruceById,
  deleteCruceById,
  getTotalProducts,
  updateProductById,
  */
} from "../controllers/aclaraciones.controllers.js";

// Ruta GET para obtener todos los cruces

const router = Router();

router.get("/stats", getStats);
router.get("/:IDOrden", getAclaracionesByOT);
// Se actualiza el estatus de un cruce, se envía el status mediante el body y el ID_Cruce por params
router.patch('/:id/UpdateAclaracion', UpdateAclaracion);
router.get("/", getAclaraciones);





/*
router.post("/importar", createNewCruces);

router.patch('/:id/estatus', actualizarEstatusCruce);

router.get("/products/count", getTotalCruces);

router.get("/products/:id", getProductById);

router.delete("/products/:id", deleteProductById);

router.put("/products/:id", updateProductById);

*/

export default router;