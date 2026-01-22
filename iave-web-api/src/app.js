import express from "express";
import cors from "cors";
import morgan from "morgan";

import crucesRoutes from "./routes/cruces.routes.js";
import abusosRoutes from "./routes/abusos.routes.js";
import aclaracionesRoutes from "./routes/aclaraciones.routes.js";
import sesgosRoutes from "./routes/sesgos.routes.js";
import casetasRoutes from "./routes/rutas_casetas.routes.js";
import tagsRoutes from "./routes/tags.routes.js";


// Se inicializa la aplicación, sobre el puerto 3001.

const app = express();
app.use(cors({
  origin: '*',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  maxAge: 86400,  // 24 hours
  preflightContinue: false, // Evita enviar una respuesta automática a las solicitudes OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'], // Especifica los encabezados permitidos en las solicitudes CORS
  exposedHeaders: ['Content-Length', 'X-Kuma-Revision'] // Especifica los encabezados que el cliente puede acceder
}));

app.use(express.json({ limit: '50mb' })); //Se corrige el limite de carga del Payload, para que la conexión admita la subida del archivo de cruces con tamaños de hasta 50 MB.
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan("dev"));



// Routes
app.use("/api/cruces", crucesRoutes);
app.use("/api/abusos", abusosRoutes);
app.use("/api/aclaraciones", aclaracionesRoutes);
app.use("/api/sesgos", sesgosRoutes);
app.use("/api/casetas", casetasRoutes);
app.use("/api/tags", tagsRoutes);





export default app;