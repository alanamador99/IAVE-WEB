import DashboardCard from "../shared/DashboardCard";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const cards = [
  {
    titulo: 'Aclaraciones',
    descripcion: 'Tarifa incorrecta por tramo, ejes o diferencia de cuotas; deben tener una aclaración en PASE',
    bg: 'bg-warning',
    ruta: '/aclaraciones',
  },
  {
    titulo: 'Abusos',
    descripcion: 'Uso personal del TAG; reconocido principalmente por cruces en horarios sin OT asignada',
    bg: 'bg-danger',
    ruta: '/abusos',
  },
  {
    titulo: 'Registro',
    descripcion: 'Diferencias por captura o sesgos en el sistema que requieren análisis profundo',
    bg: 'bg-info',
    ruta: '/errores',
  },
];

function Stats({ datosFiltrados }) {
  const [searchParams] = useSearchParams();
  const currentMonth = searchParams.get("m");
  const currentYear = searchParams.get("y");

  const [stats, setStats] = useState({
    Confirmado: '⟳',
    Abuso: '⟳',
    Aclaración: '⟳',
    Error: '⟳',
    Pendiente: '⟳'
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (datosFiltrados && Array.isArray(datosFiltrados)) {
      const newStats = {
        Confirmado: 0,
        Abuso: 0,
        Aclaración: 0,
        Error: 0,
        Pendiente: 0
      };

      datosFiltrados.forEach((cruce) => {
        const estatus = cruce.Estatus;
        if (newStats[estatus] !== undefined) {
          newStats[estatus] += 1;
        }
      });

      setStats(newStats);
      setLoading(false);
    } else {
      const fetchStats = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/cruces/stats`);
          const responseData = res.data;

          const newStats = {
            Confirmado: 0,
            Abuso: 0,
            Aclaración: 0,
            Error: 0,
            Pendiente: 0
          };

          responseData.forEach((e) => {
            const name = e.Estatus;
            newStats[name] = e.total;
          });

          setStats(newStats);
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
      <div className="d-flex justify-content-center align-items-center" style={{ height: "15vh" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem" }}>
          <span className="visually-hidden">.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 pt-4">
      <div className="row justify-content-center">
        {cards.map((card, idx) => {
          let url = card.ruta;
          if (currentYear && currentMonth !== null) {
            url += `?y=${currentYear}&m=${currentMonth}`;
          } else if (currentYear) {
            url += `?y=${currentYear}`;
          } else if (currentMonth !== null) {
            url += `?m=${currentMonth}`;
          }

          return (
            <DashboardCard
              titulo={card.titulo}
              descripcion={card.descripcion}
              valor={(card.titulo === 'Registro') ? stats.Error : (card.titulo === 'Abusos') ? stats.Abuso : stats.Aclaración}
              bg={card.bg}
              ruta={url}
              key={idx}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Stats;
