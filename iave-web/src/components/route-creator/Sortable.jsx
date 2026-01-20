import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

function Ordenamiento({
    caseta,
    index,
    rutaSeleccionada,
    tipoVehiculo,
    handleDeleteCaseta,
    handleConsecutivoChange,
    formatearEnteros,
    switchTipoVehiculo,
    onOrdenamientoCompleto
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        setActivatorNodeRef
    } = useSortable({
        id: caseta.ID_Caseta
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? 'grabbing' : 'default',
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`tabla-ordenamiento text-center py-1 ${(rutaSeleccionada[1]?.find) ? 'table-success' : 'table-warning'}`}
        >
            {/* Celda con el handle de drag */}
            <td
                ref={setActivatorNodeRef}
                className="drag-handle py-1 tabla-ordenamiento"
                style={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                    padding: '0.5rem',
                    verticalAlign: 'middle',
                    userSelect: 'none'
                }}
                {...attributes}
                {...listeners}
            >
                <GripVertical size={18} className="text-muted" />
            </td>

            {/* ID Caseta */}
            <td className='text-right py-1 tabla-ordenamiento'>
                {caseta.ID_Caseta}{' '}
                <span
                    style={{ cursor: 'help' }}
                    title={caseta.IAVE ? 'SI Acepta el pago con TAG' : 'NO admite el pago con TAG'}
                >
                    {caseta.IAVE ? '✅' : '❌'}
                </span>
            </td>

            {/* Nombre */}
            <td className='py-1 tabla-ordenamiento'>{caseta.Nombre}</td>

            {/* Estado - con onClick funcional */}
            <td
                className='py-1 tabla-ordenamiento'>
                {caseta.Estado}
            </td>

            {/* Latitud */}
            <td className='py-1 tabla-ordenamiento'>{caseta.latitud}</td>

            {/* Longitud */}
            <td className='py-1 tabla-ordenamiento'>{caseta.longitud}</td>

            {/* Precio */}
            <td className='py-1 tabla-ordenamiento'>
                $ {formatearEnteros(caseta[switchTipoVehiculo(tipoVehiculo).replaceAll(" ", "")])}
            </td>

            {/* Consecutivo y acciones */}
            <td className='d-flex flex-row-reverse py-1 tabla-ordenamiento'>
                <button
                    className="btn btn-sm btn-outline-danger"
                    style={{ float: 'right' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCaseta(caseta.ID);
                    }}
                    title={'Retirar caseta de la ruta TUSA.'}
                >
                    <i className="fas fa-trash"></i>
                </button>
                <input
                    style={{
                        maxWidth: '3rem',
                        textAlign: 'center',
                        marginRight: '0.5rem'
                    }}
                    className="form-control form-control-sm "
                    maxLength={2}
                    disabled={true}
                    type="text"
                    name="txtCasetaConsecutivo"
                    id={`txtCasetaConsecutivo_${caseta.ID_Caseta}`}
                    value={caseta.consecutivo || ''}
                    onChange={(e) => {
                        e.stopPropagation();
                        const valor = e.target.value;
                        // Solo permitir números
                        if (valor === '' || /^\d+$/.test(valor)) {
                            handleConsecutivoChange(caseta.ID_Caseta, valor);
                            if (onOrdenamientoCompleto) {
                                onOrdenamientoCompleto();
                            }
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            </td>
        </tr>
    );
}

export default Ordenamiento;