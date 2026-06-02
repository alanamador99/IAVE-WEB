import React, { useState } from 'react';
import { Upload, DollarSign, User, Tag, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js apuntando a unpkg que suele estar más actualizado que cdnjs
// Importante: Usamos .mjs para versiones recientes de pdfjs-dist y https explícito
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const InvoiceAnalyzer = () => {
    const [data, setData] = useState(null); // Datos procesados { tipo: 'pdf', resumen: {}, detalles: [] }
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setLoading(true);
        setError('');
        setData(null);

        try {
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                await processPDF(file);
            } else {
                throw new Error("Formato no soportado. Este módulo solo acepta archivos PDF (Estados de Cuenta).");
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Ocurrió un error al procesar el archivo");
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA PDF ---
    const processPDF = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = "";
            let extractedItems = [];
            let totalAmount = 0;

            // Regex flexible de línea: Fecha + Desc + Monto
            // Ejemplos soportados: 
            // "01 ENE Descripción 1,000.00"
            // "1 de Feb Descripción 1,000.00"
            const monthsRegex = "ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC|ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE";
            // Grupo 1: Fecha (ej: "30 de Ene" o "01 ENE")
            // Grupo 2: Descripción
            // Grupo 3: Monto
            const lineRegex = new RegExp(`^(\\d{1,2}\\s+(?:de\\s+)?(?:${monthsRegex}))\\s+(.+?)\\s+([$]?\\s*[\\d,]+\\.\\d{2})(?:\\s+CR)?\\s*$`, 'i');

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const items = textContent.items.filter(item => item.str.trim().length > 0);

                // --- Agrupación visual por filas (eje Y) ---
                // transform[5] es la posición Y.
                const rows = {};
                const Y_TOLERANCE = 5;

                items.forEach(item => {
                    const y = item.transform[5];
                    const existingRowY = Object.keys(rows).find(key => Math.abs(parseFloat(key) - y) < Y_TOLERANCE);
                    if (existingRowY) {
                        rows[existingRowY].push(item);
                    } else {
                        rows[y] = [item];
                    }
                });

                // Ordenar filas de arriba a abajo
                const sortedYKeys = Object.keys(rows).sort((a, b) => parseFloat(b) - parseFloat(a));

                sortedYKeys.forEach(key => {
                    // Ordenar elementos en X
                    const rowItems = rows[key].sort((a, b) => a.transform[4] - b.transform[4]);

                    const lineText = rowItems.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
                    fullText += lineText + "\n";

                    const match = lineText.match(lineRegex);
                    if (match) {
                        const fecha = match[1];
                        const descripcion = match[2].trim();
                        const montoStr = match[3].replace(/[$,\s]/g, '');

                        if (descripcion.length > 3 && !isNaN(parseFloat(montoStr))) {
                            extractedItems.push({
                                fecha: fecha,
                                descripcion: descripcion,
                                monto: parseFloat(montoStr)
                            });
                            if (descripcion.toLowerCase().includes('compra') || descripcion.toLowerCase().includes('cargo')) {
                                totalAmount += parseFloat(montoStr);
                            }
                            if (descripcion.toLowerCase().includes('devoluc') || descripcion.toLowerCase().includes('pago recibido')) {
                                totalAmount -= parseFloat(montoStr);
                            }
                        }
                    }
                });
            }

            // --- ORDENAMIENTO CRONOLÓGICO (Antiguo -> Nuevo) ---
            const monthMap = {
                'ENE': 0, 'ENERO': 0,
                'FEB': 1, 'FEBRERO': 1,
                'MAR': 2, 'MARZO': 2,
                'ABR': 3, 'ABRIL': 3,
                'MAY': 4, 'MAYO': 4,
                'JUN': 5, 'JUNIO': 5,
                'JUL': 6, 'JULIO': 6,
                'AGO': 7, 'AGOSTO': 7,
                'SEP': 8, 'SEPTIEMBRE': 8,
                'OCT': 9, 'OCTUBRE': 9,
                'NOV': 10, 'NOVIEMBRE': 10,
                'DIC': 11, 'DICIEMBRE': 11
            };

            const getMonthIndex = (str) => {
                const match = str.match(new RegExp(`(${Object.keys(monthMap).join('|')})`, 'i'));
                return match ? monthMap[match[1].toUpperCase()] : -1;
            };

            // Intentar deducir año y mes de corte desde el nombre del archivo
            const fileYearMatch = file.name.match(/20\d{2}/);
            const statementYear = fileYearMatch ? parseInt(fileYearMatch[0]) : new Date().getFullYear();
            const fileMonthIndex = getMonthIndex(file.name);
            // Si el archivo no tiene mes, usamos el mes actual como referencia
            const refMonth = fileMonthIndex > -1 ? fileMonthIndex : new Date().getMonth();

            extractedItems.sort((a, b) => {
                const monthA = getMonthIndex(a.fecha);
                const monthB = getMonthIndex(b.fecha);

                let yearA = statementYear;
                let yearB = statementYear;

                // Si el mes de la transacción es mayor al mes de corte (con margen), es del año anterior
                // Ejemplo: Corte FEB(1). Transacción NOV(10). 10 > 1 -> Año anterior.
                if (monthA > refMonth + 1) yearA--;
                if (monthB > refMonth + 1) yearB--;

                const getDay = (s) => {
                    const m = s.match(/\d+/);
                    return m ? parseInt(m[0]) : 0;
                };

                const dateValA = yearA * 10000 + monthA * 100 + getDay(a.fecha);
                const dateValB = yearB * 10000 + monthB * 100 + getDay(b.fecha);

                return dateValA - dateValB;
            });

            if (extractedItems.length === 0) {
                setError("No se detectaron transacciones. Revisa el apartado 'Texto Extraído' para ver cómo se leyó el PDF.");
            }

            setData({
                tipo: 'pdf',
                resumen: {
                    total: totalAmount,
                    fecha: new Date().toISOString(),
                    emisor: "Estado de Cuenta (AMEX)",
                    folio: fileName,
                },
                detalles: extractedItems,
                rawText: fullText
            });

        } catch (err) {
            throw new Error("Error al procesar PDF: " + (err.message || err));
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-0 text-gray-800">Analizador de Estados de Cuenta (PDF)</h1>
            </div>

            {/* Card de Carga */}
            <div className="card shadow mb-4">
                <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">Cargar Estado de Cuenta (PDF)</h6>
                </div>
                <div className="card-body">
                    <div className="input-group mb-3">
                        <input
                            type="file"
                            className="form-control"
                            id="inputGroupFile"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            disabled={loading}
                        />
                        <label className="input-group-text" htmlFor="inputGroupFile">
                            {loading ? <span className="spinner-border spinner-border-sm mr-2" /> : <Upload size={18} className="mr-2" />}
                            {loading ? 'Procesando...' : 'Cargar'}
                        </label>
                    </div>
                    {fileName && <p className="text-muted small">Archivo: {fileName}</p>}

                    {error && (
                        <div className="alert alert-danger d-flex align-items-center mt-3" role="alert">
                            <AlertCircle className="mr-2" />
                            <div>{error}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Resultados */}
            {data && (
                <>
                    {/* Resumen */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6 mb-4">
                            <div className="card border-left-primary shadow h-100 py-2">
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                                Total Detectado
                                            </div>
                                            <div className="h5 mb-0 font-weight-bold text-gray-800">
                                                {formatCurrency(data.resumen.total)}
                                            </div>
                                        </div>
                                        <div className="col-auto"><DollarSign className="text-gray-300" size={32} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6 mb-4">
                            <div className="card border-left-info shadow h-100 py-2">
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Origen</div>
                                            <div className="font-weight-bold text-gray-800 text-truncate" style={{ maxWidth: '150px' }} title={data.resumen.emisor}>
                                                {data.resumen.emisor}
                                            </div>
                                        </div>
                                        <div className="col-auto"><User className="text-gray-300" size={32} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6 mb-4">
                            <div className="card border-left-warning shadow h-100 py-2">
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Archivo / Folio</div>
                                            <div className="font-weight-bold text-gray-800 text-truncate" style={{ maxWidth: '150px' }} title={data.resumen.folio}>
                                                {data.resumen.folio}
                                            </div>
                                        </div>
                                        <div className="col-auto"><Tag className="text-gray-300" size={32} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Detalles */}
                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 font-weight-bold text-primary">Movimientos Detectados</h6>
                            <small className="text-muted">Nota: La extracción puede variar según el formato del PDF.</small>
                        </div>
                        <div className="card-body">
                            <div className="">
                                <div className="table-container table-responsive table-hover table-sm border-bottom-primary">
                                    <table className="table table-bordered table-scroll table-sm table-hover align-middle" width="100%" cellSpacing="0">
                                        <thead className="thead-light sticky-top">
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Descripción / Establecimiento</th>
                                                <th className="text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.detalles.length > 0 ? (
                                                data.detalles.map((item, idx) => (
                                                    <tr key={idx} className={`table ${(item.descripcion.toLowerCase().includes('pago recibido')) ? 'table-success' : (item.descripcion.toLowerCase().includes('devoluc')) ? 'table-warning' : (item.descripcion.toLowerCase().includes('ajuste')) ? 'table-danger' : ''}`}>
                                                        <td>{item.fecha}</td>
                                                        <td>{item.descripcion}</td>
                                                        <td className="text-right">{formatCurrency(item.monto)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="text-center text-muted">
                                                        No se encontraron movimientos.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Debug PDF Text Area */}
                    {data.rawText && (
                        <div className="card shadow mb-4 collapsed-card">
                            <div className="card-header py-3">
                                <h6 className="m-0 font-weight-bold text-secondary">Texto Extraído (Debug)</h6>
                            </div>
                            <div className="card-body">
                                <pre style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '10px' }}>{data.rawText}</pre>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default InvoiceAnalyzer;