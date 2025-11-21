import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardCard from "../shared/DashboardCard";
import { UserRoundCheck, Warehouse, UserRoundX, MapPinX } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

const configCards = [
  {
    //CasetaNoEncontradaEnRuta
    key: 'asignados',
    titulo: 'Casetas no vinculadas',
    descripcion: 'Sesgos correspondientes a las casetas que no se encuentran en la ruta o que el nombre no coincide y es necesario una vinculación en la tabla de enlace.',
    bg: 'bg-success',
    icon: <UserRoundCheck className="h-8 w-8 text-red-500" />
  },
  {
    //
    key: 'stock',
    titulo: 'Stock',
    descripcion: 'Sesgos en stock listos para asignar',
    bg: 'bg-info',
    icon: <Warehouse className="h-8 w-8 text-yellow-500" />
  },
  {
    key: 'inactivos',
    titulo: 'Inactivos',
    descripcion: 'Sesgos asignados a personal fuera de operación',
    bg: 'bg-secondary',
    icon: <UserRoundX className="h-8 w-8 text-green-500" />
  },
  {
    key: 'extravios',
    titulo: 'Extravíos',
    descripcion: 'Sesgos extraviados reportados',
    bg: 'bg-danger',
    icon: <MapPinX className="h-8 w-8 text-blue-500" />
  }
];

function StatsSesgos() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [total,setTotal] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/tags/stats`);
        setStats(res.data || {});
        const resTotal = await axios.get(`${API_URL}/api/tags/TotalStatsTags`);
        setTotal((resTotal.data[0].Total) || {});

          
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
      } finally {
        setLoading(false);
        console.log(total)
      }
    };

    fetchStats();
  }, []);

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
          titulo={titulo}
          descripcion={descripcion}
          valor={icon || 0}
          valordefault={(key==='stock') ? 'Sahagún: '+stats[0]['stockS'] + ' | ' + 'Monterrey: '+stats[0]['stockM'] : stats[0][key]}
          bg={bg}
          ruta={null}
          grande={false}
          bateriaSuperior={(key==='stock') ? 
            <>
            <span className="text-success font-weight-bold" style={{fontSize:'1.2rem'}}>
           { stats[0]['stockS'] + stats[0]['stockM'] +' | '}
          </span>
           {( 100*(stats[0]['stockS'] + stats[0]['stockM']) /total).toFixed(1)+'%'}
            </>
            :(100*stats[0][key]/total).toFixed(1) + '%' }
        />
      ))}
    </div>
  );
}

export default StatsSesgos;
