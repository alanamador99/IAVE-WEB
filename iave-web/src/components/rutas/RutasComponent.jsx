import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Accordion } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import RutasContent from '../rutas/RutasContent';
import MapaContent from '../rutas/MapaContent';

function RutasComponent() {
  const [searchParams] = useSearchParams();
  const rutaParam = searchParams.get('ruta');
  
  const [rutaSeleccionada, setRutaSeleccionada] = useState(rutaParam ? parseInt(rutaParam, 10) : null);
  const [origenDestino, setOrigenDestino] = useState(null);

  useEffect(() => {
    if (rutaParam) {
      setRutaSeleccionada(parseInt(rutaParam, 10));
    }
  }, [rutaParam]);

  // Determinar qué acordeón debe estar activo
  const activeKey = useMemo(() => {
    return (rutaSeleccionada === 0 || rutaSeleccionada === null) ? "0" : "1";
  }, [rutaSeleccionada]);

  // Memoizar el handler para evitar re-renders innecesarios
  const handleRutaSeleccionada = useCallback((ruta) => {
    setRutaSeleccionada(ruta);
    console.log('Ruta seleccionada en el componente padre:', ruta);
  }, []);

  // Memoizar el handler de origen/destino
  const handleOrigenDestino = useCallback((origenDestinoData) => {
    setOrigenDestino(origenDestinoData);
  }, []);

  // Handler para resetear la selección al hacer clic en el header de Rutas
  const handleAccordionRutasClick = useCallback(() => {
    if (rutaSeleccionada !== 0) {
      setRutaSeleccionada(0);
      setOrigenDestino(null);
    }
  }, [rutaSeleccionada]);

  return (
    <div>
      <Accordion activeKey={activeKey}>
        <Accordion.Item eventKey="0">
          <Accordion.Header onClick={handleAccordionRutasClick}>
            🚛 Rutas
          </Accordion.Header>
          <Accordion.Body>
            <RutasContent 
              initialRuta={rutaParam ? parseInt(rutaParam, 10) : null}
              onRutaSeleccionada={handleRutaSeleccionada} 
              onOrigenDestino={handleOrigenDestino} 
            />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1">
          <Accordion.Header>
            🛣️ Casetas de la ruta {origenDestino && `- ${origenDestino}`}
          </Accordion.Header>
          <Accordion.Body>
            {rutaSeleccionada && rutaSeleccionada !== 0 ? (
              <MapaContent 
                rutaSeleccionada={rutaSeleccionada} 
                origenDestino={origenDestino} 
              />
            ) : (
              <div className="alert alert-info text-center" role="alert">
                <i className="fas fa-info-circle me-2"></i>
                Selecciona una ruta de la tabla de arriba para ver sus casetas y detalles en el mapa.
              </div>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}

export default RutasComponent;