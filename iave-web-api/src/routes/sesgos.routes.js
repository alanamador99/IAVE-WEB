import { Router } from "express";
import {
  getSesgosPorCasetas,
  getSesgosByOT,
  getStats,
  UpdateSesgo,
  getSesgos
} from "../controllers/sesgos.controllers.js";

// Ruta GET para obtener todos los cruces

const router = Router();

router.get("/stats", getStats);
router.get("/rutas", getSesgosPorCasetas);
router.get("/:IDOrden/OT", getSesgosByOT);
// Se actualiza el estatus de un cruce, se envía el status mediante el body y el ID_Cruce por params
router.patch('/:id/UpdateSesgo', UpdateSesgo);
router.get("/", getSesgos);






/*
router.post("/importar", createNewCruces);

router.patch('/:id/estatus', actualizarEstatusCruce);

router.get("/products/count", getTotalCruces);

router.get("/products/:id", getProductById);

router.delete("/products/:id", deleteProductById);

router.put("/products/:id", updateProductById);

*/

export default router;