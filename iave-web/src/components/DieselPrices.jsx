import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, Form, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_API_URL;

const DieselPrices = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        entidad: '',
        municipio: '',
        razonSocial: '',
        producto: '',
        descripcion: '',
        direccion: ''
    });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    

    const API_URL = process.env.REACT_APP_API_URL;
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
            const response = await fetch(`${API_URL}/api/diesel/fetch-all`);
            
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
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            entidad: '',
            municipio: '',
            razonSocial: '',
            producto: '',
            descripcion: '',
            direccion: ''
        });
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Filtrado y ordenamiento de resultados
    const filteredResults = useMemo(() => {
        let items = results.filter(item => {
            const entMatch = !filters.entidad || 
                             (item.entidadNombre && item.entidadNombre.toLowerCase().includes(filters.entidad.toLowerCase())) ||
                             (item.entidadId && item.entidadId.toString().includes(filters.entidad));
            
            const munMatch = !filters.municipio || 
                             (item.municipioNombre && item.municipioNombre.toLowerCase().includes(filters.municipio.toLowerCase())) ||
                             (item.municipioId && item.municipioId.toString().includes(filters.municipio));
            
            const prodMatch = !filters.producto || 
                              (item.Producto && item.Producto.toLowerCase().includes(filters.producto.toLowerCase()));
            
            const descMatch = !filters.descripcion || 
                              (item.SubProducto && item.SubProducto.toLowerCase().includes(filters.descripcion.toLowerCase()));

            const dirMatch = !filters.direccion || 
                              (item.Direccion && item.Direccion.toLowerCase().includes(filters.direccion.toLowerCase()));

            const razonMatch = !filters.razonSocial ||
                               (item.Nombre && item.Nombre.toLowerCase().includes(filters.razonSocial.toLowerCase()));
                              
            return entMatch && munMatch && prodMatch && descMatch && dirMatch && razonMatch;
        });

        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Manejo especial para columnas compuestas (Entidad/Municipio)
                if (sortConfig.key === 'entidadId') {
                    aValue = a.entidadNombre || a.entidadId;
                    bValue = b.entidadNombre || b.entidadId;
                } else if (sortConfig.key === 'municipioId') {
                    aValue = a.municipioNombre || a.municipioId;
                    bValue = b.municipioNombre || b.municipioId;
                }

                // Manejo de nulos
                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                // Comparación numérica para Precio
                if (sortConfig.key === 'PrecioVigente' || sortConfig.key === 'Numero') {
                    return sortConfig.direction === 'ascending' 
                        ? parseFloat(aValue) - parseFloat(bValue)
                        : parseFloat(bValue) - parseFloat(aValue);
                }

                // Comparación de texto
                aValue = aValue.toString().toLowerCase();
                bValue = bValue.toString().toLowerCase();

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return items;
    }, [results, filters, sortConfig]);

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
            'Entidad': row?.entidadNombre || row?.entidadId,
            'Municipio': row?.municipioNombre || row?.municipioId,
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

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <i className="fas fa-sort text-muted ml-1" style={{opacity: 0.3}}></i>;
        return sortConfig.direction === 'ascending' 
            ? <i className="fas fa-sort-up ml-1"></i>
            : <i className="fas fa-sort-down ml-1"></i>;
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
                        <div className="row">
                            <div className="col-md-2 mb-2">
                                <Form.Control 
                                    type="text" 
                                    name="entidad"
                                    placeholder="Entidad" 
                                    value={filters.entidad}
                                    onChange={handleFilterChange}
                                    size="sm"
                                />
                            </div>
                            <div className="col-md-2 mb-2">
                                <Form.Control 
                                    type="text" 
                                    name="municipio"
                                    placeholder="Municipio" 
                                    value={filters.municipio}
                                    onChange={handleFilterChange}
                                    size="sm"
                                />
                            </div>
                            <div className="col-md-2 mb-2">
                                <Form.Control 
                                    type="text" 
                                    name="razonSocial"
                                    placeholder="Razón Social" 
                                    value={filters.razonSocial}
                                    onChange={handleFilterChange}
                                    size="sm"
                                />
                            </div>
                            <div className="col-md-2 mb-2">
                                <Form.Control 
                                    type="text" 
                                    name="producto"
                                    placeholder="Producto" 
                                    value={filters.producto}
                                    onChange={handleFilterChange}
                                    size="sm"
                                />
                            </div>
                            <div className="col-md-2 mb-2">
                                <Form.Control 
                                    type="text" 
                                    name="descripcion"
                                    placeholder="Descripción" 
                                    value={filters.descripcion}
                                    onChange={handleFilterChange}
                                    size="sm"
                                />
                            </div>
                            <div className="col-md-3 mb-2">
                                <Form.Control 
                                    type="text" 
                                    name="direccion"
                                    placeholder="Dirección" 
                                    value={filters.direccion}
                                    onChange={handleFilterChange}
                                    size="sm"
                                />
                            </div>
                            <div className="col-md-1 mb-2">
                                <Button variant="outline-secondary" size="sm" onClick={clearFilters} block>
                                    <i className="fas fa-times"></i>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive table-container">
                        <Table striped bordered hover id="dataTable" width="100%" cellSpacing="0" size="sm">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th onClick={() => requestSort('entidadId')} style={{cursor: 'pointer'}}>Entidad {renderSortIcon('entidadId')}</th>
                                    <th onClick={() => requestSort('municipioId')} style={{cursor: 'pointer'}}>Municipio {renderSortIcon('municipioId')}</th>
                                    <th onClick={() => requestSort('Nombre')} style={{cursor: 'pointer'}}>Razón Social {renderSortIcon('Nombre')}</th>
                                    <th onClick={() => requestSort('Producto')} style={{cursor: 'pointer'}}>Producto {renderSortIcon('Producto')}</th>
                                    <th onClick={() => requestSort('PrecioVigente')} style={{cursor: 'pointer'}}>Precio {renderSortIcon('PrecioVigente')}</th>
                                    <th onClick={() => requestSort('Direccion')} style={{cursor: 'pointer'}}>Dirección {renderSortIcon('Direccion')}</th>
                                    <th onClick={() => requestSort('SubProducto')} style={{cursor: 'pointer'}}>Descripción {renderSortIcon('SubProducto')}</th>
                                    <th onClick={() => requestSort('Numero')} style={{cursor: 'pointer'}}>Indicador {renderSortIcon('Numero')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && results.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5">
                                            <Spinner animation="border" role="status">
                                                <span className="sr-only">Cargando...</span>
                                            </Spinner>
                                            <p className="mt-2">Consultando API. Esto puede tomar unos minutos...</p>
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
                                        <td>{row?.entidadNombre || row?.entidadId}</td>
                                        <td>{row?.municipioNombre || row?.municipioId}</td>
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
