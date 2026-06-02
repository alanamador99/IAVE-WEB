import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardCard from "../shared/DashboardCard";
import { Target, AlertTriangle, DollarSign, Gavel, HandCoins, CircleCheckBig } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;
const configCards = [
  {
    key: 'pendiente_reporte',
    titulo: 'Pendiente',
    descripcion: 'Nuevos abusos identificados, pendientes de proceso.',
    bg: 'bg-danger',
    icon: <Target className="h-8 w-8 text-red-500" />,
    valordefault: 1

  },
  {
    key: 'reporte_enviado_todo_pendiente',
    titulo: 'Abuso notificado',
    descripcion: 'Abusos identificados, pendientes de descuento y acta.',
    bg: 'bg-warning',
    icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
    valordefault: 1

  },
  {
    key: 'descuento_aplicado_pendiente_acta',
    titulo: 'Descuento aplicado',
    descripcion: 'Descuento aplicado, pendiente de firma de acta.',
    bg: 'bg-info',
    icon: <HandCoins className="h-8 w-8 text-yellow-500" />,
    valordefault: 2,
  },
  {
    key: 'acta_aplicada_pendiente_descuento',
    titulo: 'Acta aplicada',
    descripcion: 'Acta administrativa aplicada, pendiente de descuento.',
    bg: 'bg-info',
    icon: <Gavel className="h-8 w-8 text-green-500" />,
    valordefault: 3,
  },
  {
    key: 'completado',
    titulo: 'Completado',
    descripcion: 'Abusos completamente gestionados.',
    bg: 'bg-success',
    icon: <DollarSign className="h-8 w-8 text-blue-500" />,
    valordefault: '$21,399.00'
  },
  {
    key: 'total',
    titulo: 'Total reportado',
    descripcion: 'Suma total de los abusos identificados.',
    bg: 'bg-dark',
    icon: <CircleCheckBig className="h-8 w-8 text-blue-500" />,
    valordefault: '$21,399.00'
  }
];


function StatsAbusos({onUpdateFromAbusosTable}) {
  const [stats, setStats] = useState({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/abusos/stats`);
        setStats(res.data || {});


      } catch (error) {
        console.error("Error al obtener estadísticcas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [onUpdateFromAbusosTable]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "12vh" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem" }}>
          <span className="visually-hidden">.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row mt-4 pt-4 justify-content-center">
      {configCards.map(({ key, titulo, descripcion, bg, icon }) => (

        <DashboardCard
          key={key}
          titulo={(stats[0][key + '_count'] > 1) ? titulo.split(' ').map(word => word.charAt(0) + word.slice(1)).join('s ') + 's' : titulo.charAt(0).toUpperCase() + titulo.slice(1)}
          descripcion={descripcion}
          valor={icon || 0}
          valordefault={(stats[0][key + '_monto'] === 0) ? <b> ——</b> : <b>  # {stats[0][key + '_count']} | $ {new Intl.NumberFormat("es-MX").format(stats[0][key + '_monto']) + '.00'} </b>}
          bg={bg}
          ruta={null}
          grande={false}
          bateriaSuperior={<><span className="font-weight-bolder text-info">💰 </span>{(100 * stats[0][key + '_monto'] / stats[0]['total_monto']).toFixed(1) + '%'} </>}
          bateriaSuperiorIzquierda={<><span className="font-weight-bolder text-dark fs-5">#️⃣</span>{(100 * stats[0][key + '_count'] / stats[0]['total_count']).toFixed(1) + '%'}</>}

        />
      ))}
    </div>
  );
}

export default StatsAbusos;
