const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'iave-web', 'src', 'components', 'rutas', 'RutasAnalyzer.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

const regex = /const RutasExpandedDetail = \(\{[^\}]*\}\) => \{[\s\S]*?\};\n\nconst RutasAnalyzer =/m;

const newComponent = \const RutasExpandedDetail = ({route, navigate, tieneHuerfanas, meses}) => {
    // Agrupar por Caseta y Clase
    const grouped = useMemo(() => {
        const ag = {};
        route.casetas.forEach(c => {
            const key = \\\\\\|\\\\\\;
            if (!ag[key]) {
                ag[key] = {
                    Caseta: c.Caseta,
                    Clase: c.Clase,
                    isHuerfana: c.Caseta?.startsWith('sinCaseta:'),
                    ID_Caseta: c.ID_Caseta,
                    years: {}
                };
            }
            if (c.Anio) {
                if (!ag[key].years[c.Anio]) {
                    ag[key].years[c.Anio] = {
                        meses: Array(12).fill(null),
                        totalAnio: 0,
                    };
                }
                const mesIdx = (c.Mes || 1) - 1;
                ag[key].years[c.Anio].meses[mesIdx] = c;
                ag[key].years[c.Anio].totalAnio += (c.TotalCruces || 0);
            }
        });
        return Object.values(ag);
    }, [route.casetas]);

    const availableYears = useMemo(() => {
        const yearsSet = new Set();
        grouped.forEach(g => Object.keys(g.years).forEach(y => yearsSet.add(y)));
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [grouped]);

    const [expandedRows, setExpandedRows] = useState({});
    const toggleRow = (key) => setExpandedRows(prev => ({...prev, [key]: !prev[key]}));

    return (
        <tr>
            <td></td>
            <td colSpan="9" className="p-0">
                <div className="bg-light p-3 border-left border-bottom border-primary" style={{borderWidth: '3px !important'}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="font-weight-bold mb-0 text-primary"><Map size={14} className="mr-1"/> Casetas de la Ruta {route.id_Tipo_ruta}</h6>
                        <div>
                            <button 
                                className="btn btn-sm btn-outline-primary mr-2"
                                onClick={() => navigate(\\\/route-creator?origen=\\\&destino=\\\\\\)}
                            >
                                <Edit3 size={12} className="mr-1"/> Editar en Route-Creator
                            </button>
                            {tieneHuerfanas && (
                                <button 
                                    className="btn btn-sm btn-warning"
                                    onClick={() => navigate('/casetas/linker')}
                                >
                                    <Link2 size={12} className="mr-1"/> Vincular Huérfanas
                                </button>
                            )}
                        </div>
                    </div>
                    <table className="table table-sm table-bordered bg-white mb-0">
                        <thead className="thead-light">
                            <tr>
                                <th style={{width: '2%'}}></th>
                                <th>Caseta</th>
                                <th>Clase</th>
                                {availableYears.map(y => (
                                    <th key={y} className="text-center">{y}</th>
                                ))}
                                <th style={{width: '5%'}}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grouped.map((g, i) => {
                                const rowKey = \\\\\\|\\\\\\;
                                const isExpanded = expandedRows[rowKey];
                                return (
                                    <React.Fragment key={i}>
                                        <tr className={g.isHuerfana ? 'table-warning' : ''}>
                                            <td>
                                                <button className="btn btn-sm btn-light py-0 px-1" onClick={() => toggleRow(rowKey)}>
                                                    {isExpanded ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                                                </button>
                                            </td>
                                            <td>
                                                {g.isHuerfana 
                                                    ? <span className="text-dark font-weight-bold" title="Caseta huérfana - sin vínculo a catálogo"><AlertTriangle size={12} className="mr-1 text-danger"/>{g.Caseta.replace('sinCaseta:', '')}</span>
                                                    : g.Caseta}
                                            </td>
                                            <td className="text-center text-muted">{g.Clase}</td>
                                            {availableYears.map(y => {
                                                const yData = g.years[y];
                                                const totalCruces = yData ? yData.totalAnio : 0;
                                                return <td key={y} className="text-center">{totalCruces > 0 ? \\\\\\ cruces\\\ : '-'}</td>;
                                            })}
                                            <td className="text-center">
                                                {g.isHuerfana ? (
                                                    <button
                                                        className="btn btn-sm btn-outline-warning py-0 px-1"
                                                        title="Vincular esta caseta en el Linker"
                                                        onClick={() => navigate('/casetas/linker')}
                                                    >
                                                        <Link2 size={12}/>
                                                    </button>
                                                ) : g.ID_Caseta ? (
                                                    <button
                                                        className="btn btn-sm btn-outline-info py-0 px-1"
                                                        title="Actualizar costos de esta caseta"
                                                        onClick={() => navigate(\\\/casetas/actualizarCaseta/\\\\\\)}
                                                    >
                                                        <DollarSign size={12}/>
                                                    </button>
                                                ) : null}
                                            </td>
                                        </tr>
                                        {isExpanded && availableYears.map(y => {
                                            const yData = g.years[y];
                                            if (!yData) return null;
                                            return (
                                                <tr key={\\\\\\-\\\\\\} className="bg-light">
                                                    <td></td>
                                                    <td colSpan={availableYears.length + 3} className="p-0">
                                                        <div className="p-2 border-left border-info ml-3 my-1 bg-white shadow-sm">
                                                            <h6 className="font-weight-bold text-info mb-2">Detalle Año {y}</h6>
                                                            <div className="table-responsive">
                                                                <table className="table table-bordered table-sm mb-0" style={{fontSize: '0.8rem'}}>
                                                                    <thead className="thead-light">
                                                                        <tr>
                                                                            <th>Mes</th>
                                                                            {meses.map(m => <th key={m} className="text-center px-1">{m}</th>)}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        <tr>
                                                                            <td className="font-weight-bold">Cruces</td>
                                                                            {meses.map((m, idx) => {
                                                                                const mData = yData.meses[idx];
                                                                                return <td key={idx} className="text-center text-muted">{mData && mData.TotalCruces ? mData.TotalCruces : '-'}</td>;
                                                                            })}
                                                                        </tr>
                                                                        <tr>
                                                                            <td className="font-weight-bold">Máximo</td>
                                                                            {meses.map((m, idx) => {
                                                                                const mData = yData.meses[idx];
                                                                                return <td key={idx} className="text-center text-danger">{mData && mData.CostoMaximo ? mData.CostoMaximo.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '-'}</td>;
                                                                            })}
                                                                        </tr>
                                                                        <tr>
                                                                            <td className="font-weight-bold">Promedio</td>
                                                                            {meses.map((m, idx) => {
                                                                                const mData = yData.meses[idx];
                                                                                return <td key={idx} className="text-center text-primary font-weight-bold">{mData && mData.CostoPromedio ? mData.CostoPromedio.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '-'}</td>;
                                                                            })}
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    );
};

const RutasAnalyzer =\;

if (content.match(regex)) {
    fs.writeFileSync(targetFile, content.replace(regex, newComponent));
    console.log('Replaced successfully');
} else {
    console.error('Regex did not match');
}
