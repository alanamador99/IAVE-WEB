// TestDoughnutMin.jsx
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function TestDoughnutMin() {
  const data = { labels: ["A","B"], datasets: [{ data: [1,2], backgroundColor: ["#f00", "#0f0"] }] };
  return (
    <div style={{ width: 300, height: 300 }}>
      <Doughnut data={data} />
    </div>
  );
}
