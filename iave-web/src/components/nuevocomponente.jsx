import React from 'react';

import {ModalConfirmacion, ModalSelector, ModalSelectorOrigenDestino, CustomToast, parsearMinutos, formatearDinero, RouteOption, formatearEnteros } from '../components/shared/utils';

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
      <ModalConfirmacion
        isOpen={true}
        onClose={() => {}}
        onSelect={() => {}}
        mensaje="¿Está seguro de que desea eliminar este contacto?"
      ></ModalConfirmacion>
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