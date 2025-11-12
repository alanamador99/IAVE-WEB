// CasetaMapModal.js
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix leaflet's default icon issue with webpack
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CasetaMapModal = ({ isOpen, onClose, nombreCaseta, lat, lng, aclaracionSeleccionado }) => {
  return (
    <Modal show={isOpen} onHide={onClose} size="md" centered>
      <Modal.Header >
        <Modal.Title>Caseta:  {nombreCaseta}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ overflowY: 'auto' }}>
        <div style={{ height: '70vh' }} className='container-fluid'>
          Ubicación de la caseta {nombreCaseta} en el mapa:
          <br />
          <div className='container-fluid' style={{ height: '25vh' }}>
            <MapContainer center={[lat, lng]} zoom={17} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors || IAVE-WEB ⭐🚌'
              />
              <Marker position={[lat, lng]}>
                <Popup>{nombreCaseta}</Popup>
              </Marker>
            </MapContainer>
          </div>
          <br />
          <br />
          <table className='table table-striped table-sm'>
            <thead>
              <tr>
                <th>Campo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nombre de la Caseta</td>
                <td>{nombreCaseta}</td>
              </tr>
              <tr>
                <td>Latitud</td>
                <td>{lat}</td>
              </tr>
              <tr>
                <td>Longitud</td>
                <td>{lng}</td>
              </tr>
              <tr>
                <td>Estado</td>
                <td>{aclaracionSeleccionado?.Estado || 'N/A'}</td>
              </tr>
              <tr>
                <td colSpan={2} className='text-success table-info text-center font-weight-bold py-1 px-0'><h5>Costos</h5></td>
              </tr>
              <tr>
                <td colSpan={1}>Automovil</td>
                <td>${aclaracionSeleccionado?.Automovil}</td>
              </tr>

              <tr>
                <td colSpan={1}>Camion2Ejes</td>
                <td>${aclaracionSeleccionado?.Camion2Ejes}</td>
              </tr>

              <tr>
                <td colSpan={1}>Camion3Ejes</td>
                <td>${aclaracionSeleccionado?.Camion3Ejes}</td>
              </tr>

              <tr>
                <td colSpan={1}>Camion5Ejes</td>
                <td>${aclaracionSeleccionado?.Camion5Ejes}</td>
              </tr>

              <tr>
                <td colSpan={1}>Camion9Ejes</td>
                <td>${aclaracionSeleccionado?.Camion9Ejes}</td>
              </tr>
            </tbody>

          </table>





        </div>
      </Modal.Body>
      <Modal.Footer>

        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CasetaMapModal;
