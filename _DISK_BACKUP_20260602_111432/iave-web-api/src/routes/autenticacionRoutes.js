import { Router } from "express";
import {
    loginAPI
} from "../controllers/autenticacion.controllers.js";


const router = Router();

router.patch("/login", loginAPI);

export default router;