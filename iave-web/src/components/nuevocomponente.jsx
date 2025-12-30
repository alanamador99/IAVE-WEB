import React from 'react';
import { MapPin, Mail, Phone, User, Calendar, Building } from 'lucide-react';

const ContactCard = ({ data }) => {
  const {
    ID_entidad,
    Grupo,
    Nombre,
    Razon_social,
    Direccion,
    Correo_electronico,
    Fecha_captura,
    ID_Usuario,
    Cvo_pasaje,
    ID_poblacion,
    Contacto,
    Celular,
    latitud,
    longitud
  } = data;

  return (
    <div className="col-xl-3 col-lg-4 col-md-6 mb-4">
      <div className="card shadow-sm h-100 border-left-primary" style={{ borderLeftWidth: '4px' }}>
        <div className="card-body p-3">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="text-primary font-weight-bold mb-0" style={{ fontSize: '0.85rem' }}>
              {Nombre}
            </h6>
            <span className="badge badge-primary badge-sm">{Grupo}</span>
          </div>
          
          {/* Razón Social */}
          <p className="text-gray-800 mb-2" style={{ fontSize: '0.75rem' }}>
            <Building size={12} className="mr-1" style={{ display: 'inline', verticalAlign: 'middle' }} />
            {Razon_social}
          </p>

          {/* Información de Contacto */}
          <div className="mb-2">
            <div className="d-flex align-items-center mb-1" style={{ fontSize: '0.7rem' }}>
              <User size={11} className="text-gray-600 mr-1" />
              <span className="text-gray-700">{Contacto}</span>
            </div>
            
            <div className="d-flex align-items-center mb-1" style={{ fontSize: '0.7rem' }}>
              <Phone size={11} className="text-gray-600 mr-1" />
              <span className="text-gray-700">{Celular}</span>
            </div>
            
            <div className="d-flex align-items-center mb-1" style={{ fontSize: '0.7rem' }}>
              <Mail size={11} className="text-gray-600 mr-1" />
              <span className="text-gray-700 text-truncate" style={{ maxWidth: '180px' }}>
                {Correo_electronico}
              </span>
            </div>
          </div>

          {/* Dirección */}
          <div className="mb-2 pb-2 border-bottom" style={{ fontSize: '0.7rem' }}>
            <MapPin size={11} className="text-gray-600 mr-1" style={{ display: 'inline', verticalAlign: 'top' }} />
            <span className="text-gray-700">{Direccion}</span>
          </div>

          {/* Metadata Grid */}
          <div className="row text-xs text-gray-600 g-1">
            <div className="col-6 mb-1">
              <small className="d-block text-muted">ID:</small>
              <small className="font-weight-bold">{ID_entidad}</small>
            </div>
            <div className="col-6 mb-1">
              <small className="d-block text-muted">Usuario:</small>
              <small className="font-weight-bold">{ID_Usuario}</small>
            </div>
            <div className="col-6 mb-1">
              <small className="d-block text-muted">Población:</small>
              <small className="font-weight-bold">{ID_poblacion}</small>
            </div>

            <div className="col-12">
              <small className="text-muted">
                <Calendar size={10} className="mr-1" style={{ display: 'inline', verticalAlign: 'middle' }} />
                {Fecha_captura}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente contenedor de ejemplo
const ContactCardGrid = () => {
  const sampleData = [
   
    {
      ID_entidad: 1004,
      Grupo: "Regular",
      Nombre: "Tienda Mi Pueblo",
      Razon_social: "Mi Pueblo Comercializadora",
      Direccion: "Calle Hidalgo 321, Centro Histórico",
      Correo_electronico: "info@mipueblo.com",
      Fecha_captura: "2024-12-25",
      ID_Usuario: 34,
      Cvo_pasaje: "P-004",
      ID_poblacion: 304,
      Contacto: "Ana Martínez Ruiz",
      Celular: "777-444-9876",
      latitud: 20.4567,
      longitud: -97.8901
    }
  ];

  return (
    <div className="container-fluid">
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/startbootstrap-sb-admin-2/4.1.4/css/sb-admin-2.min.css"
        rel="stylesheet"
      />
      
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Directorio de Contactos</h1>
      </div>

      <div className="row">
        {sampleData.map((contact) => (
          <ContactCard key={contact.ID_entidad} data={contact} />
        ))}
      </div>
    </div>
  );
};

export default ContactCardGrid;