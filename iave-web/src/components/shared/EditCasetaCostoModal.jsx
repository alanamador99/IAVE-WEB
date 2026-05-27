import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.252:3001';

function EditCasetaCostoModal({
  show,
  onClose,
  onSaved,
  idCaseta,
  nombreCaseta
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [peajeAutomovil, setPeajeAutomovil] = useState('');
  const [peajeBusDosEjes, setPeajeBusDosEjes] = useState('');
  const [peajeDosEjes, setPeajeDosEjes] = useState('');
  const [peajeTresEjes, setPeajeTresEjes] = useState('');
  const [peajeCincoEjes, setPeajeCincoEjes] = useState('');
  const [peajeNueveEjes, setPeajeNueveEjes] = useState('');

  const [idPase, setIdPase] = useState(null);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (!show || !idCaseta) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Obtener datos TUSA actuales
        const { data: dataCaseta } = await axios.get(
          `${API_URL}/api/casetas/${idCaseta}/getCasetaByID`
        );

        // Establecer valores TUSA actuales
        setPeajeAutomovil(dataCaseta?.Automovil || '');
        setPeajeBusDosEjes(dataCaseta?.Autobus2Ejes || '');
        setPeajeDosEjes(dataCaseta?.Camion2Ejes || '');
        setPeajeTresEjes(dataCaseta?.Camion3Ejes || '');
        setPeajeCincoEjes(dataCaseta?.Camion5Ejes || '');
        setPeajeNueveEjes(dataCaseta?.Camion9Ejes || '');

        // Guardar ID_PASE si existe para obtener tarifas
        if (dataCaseta?.ID_PASE) {
          setIdPase(dataCaseta.ID_PASE);

          try {
            // 2. Obtener tarifas de PASE si existe vinculación
            const { data: tarifasData } = await axios.get(
              `${API_URL}/api/casetas/pase/${dataCaseta.ID_PASE}/tarifas`
            );

            // Mapear tarifas PASE a campos locales
            if (Array.isArray(tarifasData) && tarifasData.length > 0) {
              const primerCuerpo = tarifasData[0];

              if (primerCuerpo.tarifas && Array.isArray(primerCuerpo.tarifas)) {
                primerCuerpo.tarifas.forEach(tarifa => {
                  // Mapear clase PASE a tipo de vehículo local
                  const clase = tarifa.clase?.toUpperCase() || '';
                  const costo = parseFloat(tarifa.costo) || 0;

                  switch (clase) {
                    case 'AUTOMOVIL':
                      setPeajeAutomovil(costo || peajeAutomovil);
                      break;
                    case 'AUTOBUS_2':
                    case 'AUTOBUS 2':
                      setPeajeBusDosEjes(costo || peajeBusDosEjes);
                      break;
                    case 'T2':
                    case 'CAMION_2':
                    case 'CAMION 2':
                      setPeajeDosEjes(costo || peajeDosEjes);
                      break;
                    case 'T3':
                    case 'CAMION_3':
                    case 'CAMION 3':
                      setPeajeTresEjes(costo || peajeTresEjes);
                      break;
                    case 'T5':
                    case 'CAMION_5':
                    case 'CAMION 5':
                      setPeajeCincoEjes(costo || peajeCincoEjes);
                      break;
                    case 'T9':
                    case 'CAMION_9':
                    case 'CAMION 9':
                      setPeajeNueveEjes(costo || peajeNueveEjes);
                      break;
                    default:
                      break;
                  }
                });
              }
            }
          } catch (err) {
            console.warn('No se pudieron cargar tarifas PASE:', err);
            // Continuar sin tarifas PASE, usar valores TUSA
          }
        }
      } catch (err) {
        setError('Error al cargar datos de la caseta: ' + (err.response?.data?.msg || err.message));
        console.error('Error fetching caseta data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [show, idCaseta]);

  const handleClose = () => {
    setError('');
    onClose?.();
  };

  const handleSave = async () => {
    // Validar que no estén vacíos
    if (!peajeAutomovil || !peajeBusDosEjes || !peajeDosEjes || !peajeTresEjes || !peajeCincoEjes || !peajeNueveEjes) {
      setError('Todos los campos de peaje son requeridos');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ID_Caseta: idCaseta,
        API_peajeAutomovil: parseFloat(peajeAutomovil),
        API_peajeBusDosEjes: parseFloat(peajeBusDosEjes),
        API_peajeDosEjes: parseFloat(peajeDosEjes),
        API_peajeTresEjes: parseFloat(peajeTresEjes),
        API_peajeCincoEjes: parseFloat(peajeCincoEjes),
        API_peajeNueveEjes: parseFloat(peajeNueveEjes)
      };

      await axios.patch(`${API_URL}/api/casetas/updateCasetaByID`, payload);

      // Llamar callback de éxito y cerrar
      onSaved?.();
      handleClose();
    } catch (err) {
      setError('Error al guardar los costos: ' + (err.response?.data?.msg || err.message));
      console.error('Error saving caseta costs:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-dollar-sign mr-2"></i>
          Editar Costos - {nombreCaseta}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mr-2" />
            <span>Cargando datos...</span>
          </div>
        ) : (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="font-weight-bold">Automóvil</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={peajeAutomovil}
                onChange={e => setPeajeAutomovil(e.target.value)}
                placeholder="0.00"
                disabled={saving}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="font-weight-bold">Autobús 2 Ejes</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={peajeBusDosEjes}
                onChange={e => setPeajeBusDosEjes(e.target.value)}
                placeholder="0.00"
                disabled={saving}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="font-weight-bold">Camión 2 Ejes</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={peajeDosEjes}
                onChange={e => setPeajeDosEjes(e.target.value)}
                placeholder="0.00"
                disabled={saving}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="font-weight-bold">Camión 3 Ejes</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={peajeTresEjes}
                onChange={e => setPeajeTresEjes(e.target.value)}
                placeholder="0.00"
                disabled={saving}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="font-weight-bold">Camión 5 Ejes</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={peajeCincoEjes}
                onChange={e => setPeajeCincoEjes(e.target.value)}
                placeholder="0.00"
                disabled={saving}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="font-weight-bold">Camión 9 Ejes</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={peajeNueveEjes}
                onChange={e => setPeajeNueveEjes(e.target.value)}
                placeholder="0.00"
                disabled={saving}
              />
            </Form.Group>

            {idPase && (
              <div className="alert alert-info alert-sm mb-2">
                <small>
                  <i className="fas fa-info-circle mr-2"></i>
                  Vinculada a PASE ID: <strong>{idPase}</strong>
                </small>
              </div>
            )}
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={saving || loading}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? (
            <>
              <Spinner animation="border" size="sm" className="mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <i className="fas fa-save mr-2"></i>
              Guardar
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default EditCasetaCostoModal;
