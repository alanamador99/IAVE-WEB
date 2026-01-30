
import { getGeneralDashboardData, getRutasFromTUSA} from "../controllers/dashboard.controller.js";
import { Router } from "express";
const router = Router();


//Verificación de que la ruta funciona
router.get("/", (req, res) => {
    res.send("Dashboard route is working");
});


router.post("/getDashboardData/", getGeneralDashboardData);
router.get("/getRutasInfo/", getRutasFromTUSA);
//ejemplo: /cruces-stats-dashboard/orden0/matricula0/FechaInicio2023-01-01/FechaFin2023-12-31/idRuta0

export default router;