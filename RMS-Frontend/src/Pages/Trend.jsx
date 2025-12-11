import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL = "/api/lots/all/";

const Trend = () => {
  const [chartData, setChartData] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const res = await axios.get(API_URL);
      const raw = res.data.data;

      // Get unique symbols
      const uniqueSymbols = [...new Set(raw.map(i => i.symbol))];
      setSymbols(uniqueSymbols);

      // Aggregate data per login for each symbol
      const loginIds = [...new Set(raw.map(i => i.login_id))];

      const dataPerSymbol = uniqueSymbols.map(symbol => {
        return {
          symbol,
          data: loginIds.map(login => {
            const item = raw.find(
              x => x.login_id === login && x.symbol === symbol
            );
            return { login: login.toString(), lot: item ? parseFloat(item.lot) : 0 };
          }),
        };
      });

      setChartData(dataPerSymbol);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <p className="text-gray-500 animate-pulse">Loading charts...</p>;

  return (
    <div className="p-6  col-2 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Lot Trend per Symbol</h2>

      {chartData.map((symbolChart, idx) => (
        <div
          key={symbolChart.symbol}
          className="p-4 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200"
        >
          <h3 className="text-xl font-semibold mb-2">{symbolChart.symbol}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={symbolChart.data}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="login" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="lot"
                stroke={getColor(idx)}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

// Helper function to get color for each line
const getColor = idx => {
  const colors = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
    "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
    "#bcbd22", "#17becf"
  ];
  return colors[idx % colors.length];
};

export default Trend;
