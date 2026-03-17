import React, { useState } from 'react';
import { Upload, FileText, DollarSign, Calendar, User, Tag, AlertCircle } from 'lucide-react';

const XmlAnalyzer = () => {
  const [xmlData, setXmlData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

          if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            throw new Error("Error al procesar el archivo XML");
          }

          parseCFDI(xmlDoc);
        } catch (err) {
          setError("No se pudo leer el archivo XML. Asegúrate de que es un CFDI válido.");
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
  };

  const parseCFDI = (xmlDoc) => {
    try {
      const getTag = (tagName) => {
        const tags = xmlDoc.getElementsByTagName(tagName);
        if (tags.length === 0) {
          return xmlDoc.getElementsByTagName("cfdi:" + tagName);
        }
        return tags;
      };

      const comprobante = getTag("Comprobante")[0];
      const emisor = getTag("Emisor")[0];
      const receptor = getTag("Receptor")[0];
      const conceptos = getTag("Concepto");

      if (!comprobante) throw new Error("No es un comprobante CFDI válido");

      const conceptosArray = [];
      for (let i = 0; i < conceptos.length; i++) {
        const c = conceptos[i];
        conceptosArray.push({
          cantidad: c.getAttribute("Cantidad"),
          unidad: c.getAttribute("Unidad") || c.getAttribute("ClaveUnidad"),
          descripcion: c.getAttribute("Descripcion"),
          valorUnitario: parseFloat(c.getAttribute("ValorUnitario")),
          importe: parseFloat(c.getAttribute("Importe")),
          claveProdServ: c.getAttribute("ClaveProdServ")
        });
      }

      const timbre = getTag("TimbreFiscalDigital")[0] || {};

      const parsedData = {
        serie: comprobante.getAttribute("Serie") || '',
        folio: comprobante.getAttribute("Folio") || '',
        fecha: comprobante.getAttribute("Fecha"),
        total: parseFloat(comprobante.getAttribute("Total")),
        subTotal: parseFloat(comprobante.getAttribute("SubTotal")),
        moneda: comprobante.getAttribute("Moneda"),
        tipoDeComprobante: comprobante.getAttribute("TipoDeComprobante"),
        emisor: {
          rfc: emisor?.getAttribute("Rfc"),
          nombre: emisor?.getAttribute("Nombre"),
          regimen: emisor?.getAttribute("RegimenFiscal")
        },
        receptor: {
          rfc: receptor?.getAttribute("Rfc"),
          nombre: receptor?.getAttribute("Nombre"),
          usoCFDI: receptor?.getAttribute("UsoCFDI")
        },
        conceptos: conceptosArray,
        uuid: timbre.getAttribute ? timbre.getAttribute("UUID") : "No encontrado"
      };

      setXmlData(parsedData);
      setError('');
    } catch (err) {
      setError("Error al interpretar la estructura del CFDI: " + err.message);
      setXmlData(null);
    }
  };

  const formatearDinero = (cantidad) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cantidad);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Verificador de Facturas XML</h1>
      </div>

      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Cargar CFDI (XML)</h6>
        </div>
        <div className="card-body">
          <div className="input-group mb-3">
            <input
              type="file"
              className="form-control"
              id="inputGroupFile02"
              accept=".xml"
              onChange={handleFileUpload}
            />
            <label className="input-group-text" htmlFor="inputGroupFile02">
              <Upload size={18} className="mr-2" /> Cargar
            </label>
          </div>
          {fileName && <p className="text-muted small">Archivo seleccionado: {fileName}</p>}
          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <AlertCircle className="mr-2" />
              <div>{error}</div>
            </div>
          )}
        </div>
      </div>

      {xmlData && (
        <>
          <div className="row">
            <div className="col-xl-4 col-md-6 mb-4">
              <div className="card border-left-primary shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Factura</div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {formatearDinero(xmlData.total)} {xmlData.moneda}
                      </div>
                    </div>
                    <div className="col-auto"><DollarSign className="text-gray-300" size={32} /></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-4 col-md-6 mb-4">
              <div className="card border-left-success shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-success text-uppercase mb-1">Fecha Emisión</div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">{new Date(xmlData.fecha).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{new Date(xmlData.fecha).toLocaleTimeString()}</div>
                    </div>
                    <div className="col-auto"><Calendar className="text-gray-300" size={32} /></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-4 col-md-6 mb-4">
              <div className="card border-left-info shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Emisor</div>
                      <div className="font-weight-bold text-gray-800 " style={{ maxWidth: '150px' }} title={xmlData.emisor.nombre}>{xmlData.emisor.nombre}</div>
                      <div className="text-xs text-gray-500">{xmlData.emisor.rfc}</div>
                    </div>
                    <div className="col-auto"><User className="text-gray-300" size={32} /></div>
                  </div>
                </div>
              </div>
            </div>


          </div>

          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Conceptos de la Factura</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <div className="table-container">
                  <table className="table table-bordered table-striped" width="100%" cellSpacing="0">
                    <thead className="thead-light">
                      <tr>
                        <th>Cant.</th>
                        <th>Unidad</th>
                        <th>Descripción</th>
                        <th className="text-right">Precio Unit. sin IVA</th>
                        <th className="text-right">Subtotal sin IVA</th>
                        <th className="text-right">IVA</th>
                        <th className="text-right">Importe final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {xmlData.conceptos.map((concepto, idx) => (
                        <tr key={idx}>
                          <td>{concepto.cantidad}</td>
                          <td>{concepto.unidad}</td>
                          <td>
                            {concepto.descripcion}
                            <br />
                            <small className="text-muted">Clave SAT: {concepto.claveProdServ}</small>
                          </td>
                          <td className="text-right">{formatearDinero(concepto.valorUnitario)}</td>
                          <td className="text-right">{formatearDinero(concepto.importe)}</td>
                          <td className="text-right">{formatearDinero(concepto.importe * 0.16)}</td>
                          <td className="text-right">{formatearDinero(concepto.importe * 1.16)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="5" className="text-right font-weight-bold">Subtotal:</td>
                        <td colSpan="2" className="text-right font-weight-bold">{formatearDinero(xmlData.subTotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan="5" className="text-right font-weight-bold">Total:</td>
                        <td colSpan="2" className="text-right font-weight-bold text-primary">{formatearDinero(xmlData.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default XmlAnalyzer;