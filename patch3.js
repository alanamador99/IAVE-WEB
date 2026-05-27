const fs = require('fs');

const path = 'c:/Users/IAVE/Documents/Proyecto IAVE WEB/iave-web/src/components/NuevoComponente.jsx';
let content = fs.readFileSync(path, 'utf-8');

const modalStr = \
            {/* Modal de Casetas */}
            <Modal show={showCasetasModal} onHide={() => setShowCasetasModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-road mr-2"></i>
                        Detalle de Casetas - OT: <span className="text-primary">{casetasData.ot}</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {casetasData.loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Cargando...</span>
                            </div>
                            <p className="mt-2 text-muted">Obteniendo cruces y casetas esperadas...</p>
                        </div>
                    ) : casetasData.error ? (
                        <div className="alert alert-danger">{casetasData.error}</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                                <thead className="thead-light">
                                    <tr>
                                        <th>Orden</th>
                                        <th>Caseta Esperada</th>
                                        <th>Estado</th>
                                        <th>Detalles del Cruce</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {casetasData.expected.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center text-muted py-3">No hay casetas registradas para esta ruta.</td></tr>
                                    ) : (
                                        casetasData.expected.map((caseta, i) => {
                                            // Buscar si hay un cruce que concuerde.
                                            const cruce = casetasData.crossed.find(c => 
                                                c.idCaseta === caseta.ID_Caseta || 
                                                (c.Caseta && caseta.Nombre_IAVE && c.Caseta.toUpperCase().includes(caseta.Nombre_IAVE.toUpperCase())) ||
                                                (c.Caseta && caseta.Nombre && c.Caseta.toUpperCase().includes(caseta.Nombre.toUpperCase()))
                                            );
                                            
                                            // Estilo basado en si fue cruzada o no
                                            // Gris claro/blanco = Pendiente. Verde claro (table-success) = Cruzada.
                                            return (
                                                <tr key={i} className={cruce ? 'table-success' : 'text-muted'}>
                                                    <td className="text-center align-middle"><strong>{i + 1}</strong></td>
                                                    <td className="align-middle">
                                                        <strong>{caseta.Nombre_IAVE || caseta.Nombre || caseta.Caseta}</strong>
                                                        <div className="small font-italic">{caseta.Concesionario || 'N/A'}</div>
                                                    </td>
                                                    <td className="text-center align-middle">
                                                        {cruce ? (
                                                            <span className="badge badge-success"><i className="fas fa-check"></i> Cruzada</span>
                                                        ) : (
                                                            <span className="badge badge-secondary"><i className="fas fa-clock"></i> Pendiente</span>
                                                        )}
                                                    </td>
                                                    <td className="align-middle">
                                                        {cruce ? (
                                                            <div className="small">
                                                                <div><strong>Fecha:</strong> {new Date(cruce.Fecha).toLocaleString('es-MX')}</div>
                                                                <div><strong>Importe:</strong> $\</div>
                                                                {cruce.Tag && <div><strong>TAG:</strong> {cruce.Tag}</div>}
                                                            </div>
                                                        ) : (
                                                            <span className="small font-italic">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                            {casetasData.crossed.filter(c => !casetasData.expected.some(e => e.ID_Caseta === c.idCaseta || (e.Nombre_IAVE && c.Caseta.toUpperCase().includes(e.Nombre_IAVE.toUpperCase())))).length > 0 && (
                                <div className="mt-4">
                                    <h6 className="text-danger"><i className="fas fa-exclamation-triangle mr-1"></i> Cruces registrados no mapeados a la ruta:</h6>
                                    <table className="table table-sm table-bordered mt-2">
                                        <thead className="table-danger">
                                            <tr>
                                                <th>Caseta Reportada</th>
                                                <th>Fecha</th>
                                                <th>Importe</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {casetasData.crossed.filter(c => !casetasData.expected.some(e => e.ID_Caseta === c.idCaseta || (e.Nombre_IAVE && c.Caseta.toUpperCase().includes(e.Nombre_IAVE.toUpperCase())))).map((cruce, i) => (
                                                <tr key={i}>
                                                    <td className="align-middle"><strong>{cruce.Caseta}</strong></td>
                                                    <td className="align-middle">{new Date(cruce.Fecha).toLocaleString('es-MX')}</td>
                                                    <td className="align-middle">$\</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCasetasModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>\;

const targetStr = "</Modal>\\r\\n        </div>";
content = content.replace("</Modal>\\r\\n        </div>", "</Modal>\\n\\n" + modalStr + "\\n        </div>");
if (content === fs.readFileSync(path, 'utf-8')) {
    content = content.replace("</Modal>\\n        </div>", "</Modal>\\n\\n" + modalStr + "\\n        </div>");
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Modal added successfully!');
