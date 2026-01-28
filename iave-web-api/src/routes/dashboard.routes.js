
import { getGeneralDashboardData} from "../controllers/dashboard.controller.js";
import { Router } from "express";
const router = Router();




router.post("/getDashboardData/", getGeneralDashboardData);
//ejemplo: /cruces-stats-dashboard/orden0/matricula0/FechaInicio2023-01-01/FechaFin2023-12-31/idRuta0

export default router;