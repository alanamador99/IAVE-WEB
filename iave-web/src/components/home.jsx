import DoughnutChart from "./Dashboard/DoughnutChart";

const datosCruces = [
  { title: "En revisión", value: 120, color: "#2C3E50" },
  { title: "Abusos", value: 80, color: "#FC4349" },
  { title: "Aclaraciones", value: 70, color: "#6DBCDB" },
  { title: "Correctos", value: 50, color: "#F7E248" },
  { title: "Pendientes", value: 40, color: "#D7DADB" },
  { title: "Nulos", value: 20, color: "#FFFFFF" },
];

export default function Home() {
  return (
    <div className="bg-secondary p-4 rounded-lg shadow-lg container-fluid py-2 pb-0">
      <h2 className="text-white font-bold text-lg mb-2">Resumenes mensual</h2>
      <DoughnutChart
        chartItems={[
          { title: "Ventas", value: 150, color: "#10B981" },
          { title: "Marketing", value: 80, color: "#3B82F6" },
          { title: "Desarrollo", value: 120, color: "#8B5CF6" }
        ]}
        size={300}
        formatValue={(value) => `$${value}k`}
        totalLabel="PRESUPUESTO:"
      />
      <br />
      <br />
      <DoughnutChart
        chartItems={datosCruces}
        size={300}
        formatValue={(value) => `$${value}k`}
        totalLabel="NuevoValor:"
      />

    </div>
    

  );
}
