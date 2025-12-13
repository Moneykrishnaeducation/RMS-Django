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
import Loading from "../CommonComponent/Loading";

const API_URL = "/api/lots/all/";

const Trend = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChartData = async () => {
    try {
      const res = await axios.get(API_URL);
      const raw = res.data.data; // your API structure

      // Extract symbols
      const uniqueSymbols = [...new Set(raw.map(i => i.symbol))];

      // Extract login IDs
      const loginIds = [...new Set(raw.map(i => i.login_id))];

      const dataPerSymbol = uniqueSymbols.map(symbol => {
        return {
          symbol,
          data: loginIds.map(login => {
            const item = raw.find(
              x => x.login_id === login && x.symbol === symbol
            );

            return {
              login: login.toString(),

              // ⭐ Use net_lot for graph here
              lot: item ? parseFloat(item.net_lot) : 0
            };
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

  useEffect(() => {
    fetchChartData();
  }, []);

  if (loading) return <Loading message="Loading charts..." />;

  return (
    <div className="p-2 md:p-6 space-y-6 md:space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center md:text-left">
        Lot Trend per Symbol
      </h2>

      {chartData.map((symbolChart, idx) => (
        <div
          key={symbolChart.symbol}
          className="p-4 md:p-6 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 w-full"
        >
          <h3 className="text-lg md:text-xl font-semibold mb-2">
            {symbolChart.symbol}
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={symbolChart.data}
              margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="login" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="lot"
                stroke={getColor(idx)}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

// Color helper
const getColor = idx => {
  const colors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ];
  return colors[idx % colors.length];
};

export default Trend;
