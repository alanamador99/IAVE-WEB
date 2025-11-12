import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function sanitizeItems(items) {
  if (!Array.isArray(items)) return [];
  
  return items.map((item, idx) => {
    // Manejo más robusto del título
    let title;
    if (item == null) {
      title = `item-${idx}`;
    } else if (typeof item.title === "string" || typeof item.title === "number") {
      title = String(item.title);
    } else if (React.isValidElement?.(item.title)) {
      title = "[JSX Element]";
    } else {
      try {
        title = JSON.stringify(item.title);
      } catch {
        title = String(item.title || `item-${idx}`);
      }
    }

    // Validación más estricta del valor
    const rawValue = item?.value;
    const value = typeof rawValue === 'number' && !isNaN(rawValue) && isFinite(rawValue) 
      ? rawValue 
      : 0;

    // Validación del color con fallback
    const color = item?.color && typeof item.color === 'string' 
      ? item.color 
      : "#999999";

    return { title, value: Math.max(0, value), color }; // Asegurar valores positivos
  });
}

const DoughnutChart = ({ 
  chartItems, 
  size = 250, 
  cutout = "75%", 
  showTotal = true,
  totalLabel = "TOTAL:",
  borderWidth = 1,
  borderColor = "#0C1013",
  className = "",
  formatValue = (value) => value.toFixed(2)
}) => {
  const items = useMemo(() => sanitizeItems(chartItems), [chartItems]);

  const total = useMemo(() => 
    items.reduce((acc, item) => acc + item.value, 0), 
    [items]
  );

  const chartData = useMemo(() => ({
    labels: items.map((item) => item.title),
    datasets: [
      {
        data: items.map((item) => item.value),
        backgroundColor: items.map((item) => item.color),
        borderColor,
        borderWidth,
        cutout,
      },
    ],
  }), [items, borderColor, borderWidth, cutout]);

  const options = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = items[context.dataIndex];
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
            return `${item.title}: ${formatValue(item.value)} (${percentage}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
    },
  }), [items, total, formatValue]);

  // Si no hay datos válidos, mostrar estado vacío
  if (items.length === 0 || total === 0) {
    return (
      <div 
        className={`relative flex items-center justify-center bg-gray-800 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <p className="text-gray-500 text-sm">Sin datos</p>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <Doughnut data={chartData} options={options} />
      {showTotal && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-gray-400">{totalLabel}</p>
          <p className="text-2xl font-bold text-white">
            {formatValue(total)}
          </p>
        </div>
      )}
    </div>
  );
};

export default DoughnutChart;