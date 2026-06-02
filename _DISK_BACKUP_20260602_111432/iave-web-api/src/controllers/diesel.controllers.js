// iave-web-api/src/controllers/diesel.controllers.js
/**
 * Obtiene los precios del diesel actualizados de la CNE.
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
export const getDieselPrices = async (req, res) => {
    const { entidadId, municipioId } = req.body;

    if (!entidadId || !municipioId) {
        return res.status(400).json({ error: "Faltan parámetros: entidadId y municipioId" });
    }

    try {
        const url = `https://api-reportediario.cne.gob.mx/api/EstacionServicio/Petroliferos?entidadId=${entidadId}&municipioId=${municipioId}`;
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            // El API externa falló o no existe el municipio
            // Podríamos intentar devolver un error específico
            return res.status(response.status).json({ 
                error: `Error al conectar con API CNE: ${response.statusText}`, 
                status: response.status 
            });
        }

        const data = await response.json();
        
        // La API puede devolver { "Value": [], "Success": true } o directamente un array
        let items = [];
        if (Array.isArray(data)) {
            items = data;
        } else if (data.Value && Array.isArray(data.Value)) {
            items = data.Value;
        }

        return res.json({ 
            entidadId, 
            municipioId, 
            hasData: items.length > 0,
            resultados: items
        });

    } catch (error) {
        console.error("Error al obtener precios diesel:", error);
        return res.status(500).json({ error: "Error interno al contactar API CNE" });
    }
};

// Limites aproximados de municipios por entidad (INEGI + Holgura)
const ENTITY_LIMITS = {
    '01': 11, '02': 5, '03': 5, '04': 13, '05': 38,
    '06': 10, '07': 125, '08': 67, '09': 16, '10': 39,
    '11': 46, '12': 81, '13': 84, '14': 125, '15': 125,
    '16': 113, '17': 36, '18': 20, '19': 51, '20': 570,
    '21': 217, '22': 18, '23': 11, '24': 58, '25': 18,
    '26': 72, '27': 17, '28': 43, '29': 60, '30': 212,
    '31': 106, '32': 58
};

/**
 * Obtiene TODOS los precios recorriendo las entidades y municipios configurados.
 * Maneja concurrencia para optimizar tiempo.
 */
export const getAllDieselPrices = async (req, res) => {
    // Generar lista de tareas (endpoints a visitar)
    const tasks = [];
    
    // Nota: Iteramos del 01 al 32
    for (let e = 1; e <= 32; e++) {
        const entStr = e.toString().padStart(2, '0');
        const limit = ENTITY_LIMITS[entStr] || 50; // Default 50 si no está mapeado
        
        for (let m = 1; m <= limit; m++) {
            const munStr = m.toString().padStart(3, '0');
            tasks.push({ entidadId: entStr, municipioId: munStr });
            console.log(`Agregada tarea: Entidad ${entStr}, Municipio ${munStr}`);
        }
    }

    const CONCURRENCY = 30; // Peticiones simultáneas
    const results = [];
    let completed = 0;

    // Helper para procesar una tarea
    const fetchWorker = async (task) => {
        try {
            const url = `https://api-reportediario.cne.gob.mx/api/EstacionServicio/Petroliferos?entidadId=${task.entidadId}&municipioId=${task.municipioId}`;
            // console.log(`Iniciando fetch: ${url}`);
            
            const response = await fetch(url, { 
                headers: { 
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                } 
            }); 
            
            if (response.ok) {
                const data = await response.json();
                
                // Normalizar respuesta (Puede venir en data.Value o data directo)
                let items = [];
                if (Array.isArray(data)) {
                    items = data;
                } else if (data.Value && Array.isArray(data.Value)) {
                    items = data.Value;
                }

                if (items.length > 0) {
                    // Agregar metadata y guardar todo
                    return items.map(item => ({
                        ...item,
                        entidadId: task.entidadId,
                        municipioId: task.municipioId
                    }));
                }
            }
        } catch (err) {
            // Ignorar errores individuales para no romper el flujo
            // console.warn(`Fallo fetch ${task.entidadId}-${task.municipioId}`, err.message);
        }
        return null;
    };

    try {
        // Ejecución controlada por lotes (Rolling Window)
        const queue = [...tasks];
        const activeWorkers = [];
        
        const next = async () => {
            if (queue.length === 0) return;
            const task = queue.shift();
            const promise = fetchWorker(task).then((res) => {
                if (res) results.push(...res);
                activeWorkers.splice(activeWorkers.indexOf(promise), 1);
            });
            activeWorkers.push(promise);
            
            // Si hay hueco en la cola, arrancar siguiente
            if (queue.length > 0) {
                await next();
            } else {
                // Esperar a que terminen los activos
                await Promise.all(activeWorkers);
            }
        };

        // Arrancar workers iniciales
        // await Promise.all(Array(Math.min(CONCURRENCY, tasks.length)).fill().map(() => next()));
        // Simplified P-Limit logic using explicit batches for stability
        
        /* 
           Implementación de lotes explícita para evitar recursión profunda y errores de pila
           en listas muy grandes (3000+ items).
        */
        for (let i = 0; i < tasks.length; i += CONCURRENCY) {
            const batch = tasks.slice(i, i + CONCURRENCY);
            const batchPromises = batch.map(task => fetchWorker(task));
            const batchResults = await Promise.all(batchPromises);
            
            // Collect valid results
            batchResults.forEach(r => {
                if (r) results.push(...r);
            });
            console.log(`Batch ${i / CONCURRENCY + 1} completada. Total resultados hasta ahora: ${results.length}`);
        }

        return res.json({ 
            status: "success", 
            total_endpoints: tasks.length,
            resultados_encontrados: results.length,
            data: results 
        });

    } catch (bkError) {
        console.error("Error global en bulk fetch:", bkError);
        return res.status(500).json({ error: "Error procesando peticiones masivas", details: bkError.message });
    }
};
