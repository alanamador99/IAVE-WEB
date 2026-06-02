import React, { useState } from 'react';
import { Modal, Button, Table, Form } from 'react-bootstrap';
import { FileText, DollarSign, ExternalLink } from 'lucide-react';

const ModalAclaracion = ({ cruce, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    numeroAclaracion: cruce.numeroAclaracion || '',
    fechaAclaracion: cruce.fechaAclaracion || '',
    devolucionRealizada: cruce.devolucionRealizada,
    fechaDevolucion: cruce.fechaDevolucion || '',
    observaciones: cruce.observaciones || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    let nuevoEstatus = cruce.estatus;

    if (formData.numeroAclaracion && !cruce.numeroAclaracion) {
      // Si se agregó número de aclaración
      nuevoEstatus = 'aclaracion_levantada';
    }

    if (formData.devolucionRealizada && formData.fechaDevolucion) {
      // Si se marcó como devuelto
      nuevoEstatus = 'resuelto';
    }

    const cruceActualizado = {
      ...cruce,
      ...formData,
      estatus: nuevoEstatus
    };

    onUpdate(cruceActualizado);
  };

  const estatusInfo = {
    'pendiente_aclaracion': { color: 'text-red-600', label: 'Pendiente Aclaración' },
    'aclaracion_levantada': { color: 'text-yellow-600', label: 'Aclaración Levantada' },
    'resuelto': { color: 'text-green-600', label: 'Resuelto' }
  };

  return (
<div className="fixed inset-0 bg-dark bg-opacity-50 d-flex align-items-center justify-center p-4 z-50">
  <div className="bg-white rounded shadow-lg w-100 max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
    {/* Header */}
    <div className="border-bottom px-4 py-3 d-flex justify-between align-items-start">
      <div>
        <h5 className="font-weight-bold text-gray-800 mb-0">Gestión de Aclaración</h5>
        <small className="text-muted">ID: {cruce.id}</small>
      </div>
      <button onClick={onClose} className="btn btn-sm btn-light text-gray-600 shadow-none">
        ✕
      </button>
    </div>

    {/* Body */}
    <div className="px-4 py-4">
      {/* Información del cruce */}
      <div className="bg-light rounded p-3 mb-4">
        <h6 className="text-primary font-weight-bold mb-3">Información del Cruce</h6>
        <div className="row text-sm">
          <div className="col-md-6 mb-2">
            <span className="text-muted">Fecha:</span> <strong>{cruce.fecha} {cruce.hora}</strong>
          </div>
          <div className="col-md-6 mb-2">
            <span className="text-muted">Operador:</span> <strong>{cruce.operador}</strong>
          </div>
          <div className="col-md-6 mb-2">
            <span className="text-muted">Económico:</span> <strong>{cruce.numeroEconomico}</strong>
          </div>
          <div className="col-md-6 mb-2">
            <span className="text-muted">TAG:</span> <strong>{cruce.tag}</strong>
          </div>
          <div className="col-md-6 mb-2">
            <span className="text-muted">Caseta:</span> <strong>{cruce.caseta}</strong>
          </div>
          <div className="col-md-6 mb-2">
            <span className="text-muted">Clase:</span> <strong>{cruce.clase}</strong>
          </div>
          <div className="col-md-6 mb-2">
            <span className="text-muted">Importe Cobrado:</span> <strong className="text-danger">${cruce.importeCobrado}</strong>
          </div>
          <div className="col-md-6 mb-2">
            <span className="text-muted">Importe Oficial:</span> <strong className="text-success">${cruce.importeOficial}</strong>
          </div>
          <div className="col-12 mb-2">
            <span className="text-muted">Diferencia:</span> <strong className="text-danger">+${cruce.diferencia.toFixed(2)}</strong>
          </div>
          <div className="col-12">
            <span className="text-muted">Estatus Actual:</span>{' '}
            <span className={`font-weight-bold ${estatusInfo[cruce.estatus].color}`}>
              {estatusInfo[cruce.estatus].label}
            </span>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        {/* Aclaración */}
        <div className="card mb-4">
          <div className="card-header bg-white font-weight-bold text-primary d-flex align-items-center">
            <FileText className="mr-2" size={18} />
            Gestión de Aclaración
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group col-md-6">
                <label>Número de Aclaración</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.numeroAclaracion}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroAclaracion: e.target.value })
                  }
                  placeholder="Ej: ACL-2024-00158"
                />
                <small className="form-text text-muted">
                  Número proporcionado por el portal del proveedor
                </small>
              </div>
              <div className="form-group col-md-6">
                <label>Fecha de Aclaración</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fechaAclaracion}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaAclaracion: e.target.value })
                  }
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm mt-2"
            >
              <ExternalLink className="mr-1" size={14} />
              Abrir Portal PASE/IAVE
            </button>
          </div>
        </div>

        {/* Devolución */}
        <div className="card mb-4">
          <div className="card-header bg-white font-weight-bold text-primary d-flex align-items-center">
            <DollarSign className="mr-2" size={18} />
            Control de Devolución
          </div>
          <div className="card-body">
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="devolucionRealizada"
                checked={formData.devolucionRealizada}
                onChange={(e) =>
                  setFormData({ ...formData, devolucionRealizada: e.target.checked })
                }
              />
              <label className="form-check-label" htmlFor="devolucionRealizada">
                Devolución realizada
              </label>
            </div>
            {formData.devolucionRealizada && (
              <div className="form-group">
                <label>Fecha de Devolución</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fechaDevolucion}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaDevolucion: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Observaciones */}
        <div className="form-group mb-4">
          <label>Observaciones</label>
          <textarea
            className="form-control"
            rows={3}
            value={formData.observaciones}
            onChange={(e) =>
              setFormData({ ...formData, observaciones: e.target.value })
            }
            placeholder="Notas adicionales sobre el proceso de aclaración..."
          />
        </div>

        {/* Botones */}
        <div className="d-flex justify-end border-top pt-3">
          <button
            type="button"
            className="btn btn-light mr-2"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

  );
};
export default ModalAclaracion;