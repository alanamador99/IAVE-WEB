import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardCard from "../shared/DashboardCard";
import { Target, DollarSign, Gavel, HandCoins} from 'lucide-react';


const API_URL = process.env.REACT_APP_API_URL;


const configCards = [
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
    key: 'dictaminado',
    titulo: 'Resueltos',
    descripcion: 'Cruces con aclaración resuelta; devolución completada',
    bg: 'bg-success',
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

function Stats() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/aclaraciones/stats`);
        setStats(res.data[0] || {});
        console.log(res.data[0].total_monto)


      } catch (error) {
        console.error("Error al obtener estadísticcas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "12vh" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem" }}>
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }
  return (
    <div className="row mt-4 pt-4 justify-content-center">
      {configCards.map(({ key, titulo, descripcion, bg, icon }) => (



        <DashboardCard
          key={key}
          titulo={titulo}
          descripcion={descripcion}
          valor={icon || 0}
          valordefault={(stats[key + '_count'] === 0) ? <b> ——</b> : <b>  # {stats[key + '_count']} | $ {new Intl.NumberFormat("es-MX").format(stats[key + '_monto']) + '.00'} </b>}
          bg={bg}
          ruta={null}
          grande={false}
          bateriaSuperior={<><span className="font-weight-bolder text-info">💰 </span>{(100 * stats[key + '_monto'] / stats['total_monto']).toFixed(1) + '%'} </>}
          bateriaSuperiorIzquierda={<><span className="font-weight-bolder text-dark fs-5">#️⃣</span>{(100 * stats[key + '_count'] / stats['total_count']).toFixed(1) + '%'}</>}
        />
      ))}
    </div>
  );
}

export default Stats;
