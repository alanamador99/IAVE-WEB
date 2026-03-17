// iave-web-api/src/routes/diesel.routes.js
import { Router } from "express";
import { getDieselPrices, getAllDieselPrices } from "../controllers/diesel.controllers.js";

const router = Router();

// Retrieve diesel prices by Entidad and Municipio
router.post("/fetch", getDieselPrices);
router.get("/fetch-all", getAllDieselPrices);

export default router;
