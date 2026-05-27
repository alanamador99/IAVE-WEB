import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardCard from "../shared/DashboardCard";
import { Target, DollarSign, Gavel, HandCoins } from 'lucide-react';


const API_URL = process.env.REACT_APP_API_URL;


const estatusAclaraciones = [
  {
    key: 'pendiente',
    titulo: 'Pendientes',
    descripcion: 'Cruces en revisión; requieren aclaración en PASE.',
    bg: 'bg-danger',
    icon: <Target className="h-8 w-8 text-red-500" />, // Este valor se actualizará dinámicamente
    valordefault: 1
  },
  {
    key: 'aclaracion_levantada',
    titulo: 'En proceso',
    descripcion: 'Aclaración levantada; esperando respuesta de PASE.',
    bg: 'bg-warning',
    icon: <HandCoins className="h-8 w-8 text-red-500" />,
    valordefault: 2
  },
  {
    key: 'Aprobado',
    titulo: 'Aprobados',
    descripcion: 'Cruces con aclaración dictaminada; devolución aprobada',
    bg: 'bg-success',
    icon: <Gavel className="h-8 w-8 text-red-500" />,
    valordefault: 3
  }, {
    key: 'Rechazado',
    titulo: 'Rechazados',
    descripcion: 'Cruces con aclaración dictaminada; devolución rechazada',
    bg: 'bg-danger',
    icon: <Gavel className="h-8 w-8 text-red-500" />,
    valordefault: 3
  },
  {
    key: 'total',
    titulo: 'Total Diferencia',
    descripcion: 'Suma total de diferencias tarifarias pendientes de aclaración',
    bg: 'bg-info',
    icon: <DollarSign className="h-8 w-8 text-red-500" />,
    valordefault: 4
  }
];


const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2
  }).format(amount || 0);
};

function Stats({ datosFiltrados }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (datosFiltrados && Array.isArray(datosFiltrados)) {
      const newStats = {
        total_monto: 0,
        total_count: 0,
        pendiente_count: 0,
        pendiente_monto: 0,
        aclaracion_levantada_count: 0,
        aclaracion_levantada_monto: 0,
        Aprobado_count: 0,
        Aprobado_monto: 0,
        Rechazado_count: 0,
        Rechazado_monto: 0
      };

      datosFiltrados.forEach(c => {
        const diferencia = parseFloat(c.diferencia) || 0; // diferencia es (Importe - ImporteOficial) basado en el backend
        const montoDictaminado = parseFloat(c.montoDictaminado) || 0;
        const estatus = c.Estatus_Secundario;

        newStats.total_count += 1;
        newStats.total_monto += diferencia; // El backend calcula el total gral como SUM(Importe - ImporteOficial)

        if (estatus === 'pendiente_aclaracion') {
          newStats.pendiente_count += 1;
          newStats.pendiente_monto += diferencia;
        } else if (estatus === 'aclaracion_levantada') {
          newStats.aclaracion_levantada_count += 1;
          // Backend usa: COALESCE(montoDictaminado, Importe - ImporteOficial)
          newStats.aclaracion_levantada_monto += c.montoDictaminado !== null && c.montoDictaminado !== undefined ? montoDictaminado : diferencia;
        } else if (estatus === 'Aprobado') {
          newStats.Aprobado_count += 1;
          newStats.Aprobado_monto += montoDictaminado; // Backend usa montoDictaminado explícitamente
        } else if (estatus === 'Rechazado') {
          newStats.Rechazado_count += 1;
          newStats.Rechazado_monto += montoDictaminado; // Backend usa montoDictaminado explícitamente, usualmente sumará 0 o el rechazo
        }
      });
      setStats(newStats);
      setLoading(false);
    } else {
      const fetchStats = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/aclaraciones/stats`);
          setStats(res.data[0] || {});
        } catch (error) {
          console.error("Error al obtener estadísticas:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
    }
  }, [datosFiltrados]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "12vh" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem" }}>
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }

  const totalMonto = stats.total_monto || 0;
  const totalCount = stats.total_count || 0;

  return (
    <div className="row mt-4 pt-4 justify-content-center">
      {estatusAclaraciones.map(({ key, titulo, descripcion, bg, icon }) => {
        const count = stats[`${key}_count`] || 0;
        const monto = stats[`${key}_monto`] || 0;

        // Calcular porcentajes solo si los totales son mayores a 0 para evitar NaN
        const porcentajeMonto = totalMonto > 0 ? (100 * monto) / totalMonto : 0;
        const porcentajeCount = totalCount > 0 ? (100 * count) / totalCount : 0;

        // Formatear valor por defecto
        const valorDefaultContent = (
          <span className="d-block text-center">
            <span className="d-block fw-bold fs-5 text-dark">
              {count} <small className="text-muted fs-6">cruces</small>
            </span>
            <span className="d-block fw-bold text-success">
              {formatCurrency(monto)}
            </span>
          </span>
        );
        
        // No mostrar porcentaje para la tarjeta de 'Total' ya que siempre sería 100%
        const showPercentages = key !== 'total';

        return (
          <DashboardCard
            key={key}
            titulo={titulo}
            descripcion={descripcion}
            valor={icon}
            valordefault={valorDefaultContent}
            bg={bg}
            grande={false}
            bateriaSuperior={
              showPercentages ? (
                <>
                  <span className="font-weight-bolder text-info" title="% del Monto Total">💰 </span>
                  {porcentajeMonto.toFixed(1)}%
                </>
              ) : null
            }
            bateriaSuperiorIzquierda={
              showPercentages ? (
                <>
                  <span className="font-weight-bolder text-dark fs-5" title="% del Total de Cruces">#️⃣ </span>
                  {porcentajeCount.toFixed(1)}%
                </>
              ) : null
            }
          />
        );
      })}
    </div>
  );
}

export default Stats;
