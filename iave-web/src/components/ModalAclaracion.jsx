import React, { useState } from 'react';
import { FileText, ExternalLink, DollarSign } from 'lucide-react';

const ModalAclaracion = ({ cruce, onClose, onUpdate, abrirPortalPASE }) => {
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
      nuevoEstatus = 'aclaracion_levantada';
    }
    if (formData.devolucionRealizada && formData.fechaDevolucion) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ...contenido igual que antes... */}
        {/* Reemplaza el botón de portal por: */}
        <button
          type="button"
          onClick={abrirPortalPASE}
          className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir Portal PASE/IAVE
        </button>
        {/* ...resto del código igual... */}
      </div>
    </div>
  );
};

export default ModalAclaracion;