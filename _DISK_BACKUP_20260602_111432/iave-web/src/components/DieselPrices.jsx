import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, Form, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import * as XLSX from 'xlsx';

const DieselPrices = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [filterText, setFilterText] = useState('');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);

    const fetchAllPrices = async () => {
        setLoading(true);
        setError(null);
        setResults([]);
        setCurrentPage(1); // Reset to first page on new fetch

        try {
            // Llamada al endpoint backend que maneja la concurrencia
            const response = await fetch('http://localhost:3001/api/diesel/fetch-all');
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Error en la petición al servidor');
            }

            const data = await response.json();
            
            if (data.status === 'success' && Array.isArray(data.data)) {
                setResults(data.data);
            } else {
                throw new Error('Formato de respuesta inesperado');
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterText]);

    // Filtrado de resultados
    const filteredResults = useMemo(() => {
        return results.filter(item => {
            if (!filterText) return true;
            const search = filterText.toLowerCase();
            return (
                (item.entidadId && item.entidadId.toLowerCase().includes(search)) ||
                (item.Nombre && item.Nombre.toLowerCase().includes(search)) ||
                (item.Producto && item.Producto.toLowerCase().includes(search)) ||
                (item.PrecioVigente && item.PrecioVigente.toString().includes(search)) ||
                (item.Direccion && item.Direccion.toLowerCase().includes(search)) ||
                (item.SubProducto && item.SubProducto.toLowerCase().includes(search))
            );
        });
    }, [results, filterText]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredResults.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleExportExcel = () => {
        if (filteredResults.length === 0) return;

        // Formatear datos para exportación
        const dataToExport = filteredResults.map((row, index) => ({
            '#': index + 1,
            'Entidad': row?.entidadId,
            'Municipio': row?.municipioId,
            'Razón Social': row?.Nombre,
            'Producto': row?.Producto,
            'Precio': row?.PrecioVigente,
            'Dirección': row?.Direccion,
            'Descripción': row?.SubProducto,
            'Indicador': row?.Numero
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Precios Diesel");
        XLSX.writeFile(wb, "Precios_Diesel_Nacional.xlsx");
    };

    return (
        <div className="container-fluid">
            <h1 className="h3 mb-4 text-gray-800">Scanner de Precios Diésel (Nacional)</h1>
            
            <Card className="shadow mb-4">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
                    <h6 className="m-0 font-weight-bold text-primary">Resultados de Escaneo Masivo</h6>
                    <div>
                        {filteredResults.length > 0 && (
                            <Button 
                                variant="success" 
                                className="mr-2"
                                onClick={handleExportExcel}
                            >
                                <i className="fas fa-file-excel mr-1"></i> Exportar Excel
                            </Button>
                        )}
                        <Button 
                            variant="primary" 
                            onClick={fetchAllPrices} 
                            disabled={loading}
                        >
                            {loading ? <><Spinner as="span" animation="border" size="sm"/> Escaneando...</> : 'Iniciar Escaneo Completo'}
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <div className="mb-3">
                        <Form.Control 
                            type="text" 
                            placeholder="Filtrar por Razón Social, Producto, Dirección..." 
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>

                    <div className="table-responsive table-container">
                        <Table striped bordered hover id="dataTable" width="100%" cellSpacing="0" size="sm">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Entidad</th>
                                    <th>Municipio</th>
                                    <th>Razón Social</th>
                                    <th>Producto</th>
                                    <th>Precio</th>
                                    <th>Dirección</th>
                                    <th>Descripción</th>
                                    <th>Indicador</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && results.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5">
                                            <Spinner animation="border" role="status">
                                                <span className="sr-only">Cargando...</span>
                                            </Spinner>
                                            <p className="mt-2">Consultando ~3000 endpoints gubernamentales. Esto puede tomar unos minutos...</p>
                                        </td>
                                    </tr>
                                )}
                                {!loading && results.length === 0 && !error && (
                                    <tr>
                                        <td colSpan="9" className="text-center">No hay datos para mostrar. Inicia un escaneo.</td>
                                    </tr>
                                )}
                                {currentItems.map((row, index) => (
                                    <tr key={index}>
                                        <td>{indexOfFirstItem + index + 1}</td>
                                        <td>{row?.entidadId}</td>
                                        <td>{row?.municipioId}</td>
                                        <td>{row?.Nombre}</td>
                                        <td>{row?.Producto}</td>
                                        <td className="font-weight-bold text-success">${row?.PrecioVigente}</td>
                                        <td className="small">{row?.Direccion}</td>
                                        <td className="small text-muted">{row?.SubProducto}</td>
                                        <td className="small text-muted">{row?.Numero}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <div>
                                Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredResults.length)} de {filteredResults.length} registros
                            </div>
                            <Pagination>
                                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                                
                                {currentPage > 3 && <Pagination.Ellipsis />}
                                {currentPage > 2 && <Pagination.Item onClick={() => handlePageChange(currentPage - 2)}>{currentPage - 2}</Pagination.Item>}
                                {currentPage > 1 && <Pagination.Item onClick={() => handlePageChange(currentPage - 1)}>{currentPage - 1}</Pagination.Item>}
                                
                                <Pagination.Item active>{currentPage}</Pagination.Item>
                                
                                {currentPage < totalPages && <Pagination.Item onClick={() => handlePageChange(currentPage + 1)}>{currentPage + 1}</Pagination.Item>}
                                {currentPage < totalPages - 1 && <Pagination.Item onClick={() => handlePageChange(currentPage + 2)}>{currentPage + 2}</Pagination.Item>}
                                {currentPage < totalPages - 2 && <Pagination.Ellipsis />}

                                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                                <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                            </Pagination>
                        </div>
                    )}

                    {!loading && results.length > 0 && totalPages <= 1 && (
                        <div className="mt-2 text-right text-muted small">
                            Total encontrados: {filteredResults.length} / {results.length}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default DieselPrices;
