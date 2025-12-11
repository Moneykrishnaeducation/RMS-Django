import axios from "axios";
import React, { useEffect, useState } from "react";

const SimpleDeals = () => {
  const [deals, setDeals] = useState([]);
  useEffect(() => {
    const getSimpleDeals = async () => {
  try {
    const res = await axios.get(`http://127.0.0.1:8000/api/deals/simple/2141702353/`);
    setDeals(res.data.data);
  } catch (err) {
    console.error("Deal Fetch Error:", err);
    return [];
  }
};
    getSimpleDeals();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Closed Deals</h2>

      <table className="w-full border shadow-lg rounded-lg">
        <thead className="bg-gray-100 uppercase">
          <tr>
            <th className="p-3 border">Symbol</th>
            <th className="p-3 border">Profit</th>
            <th className="p-3 border">Volume</th>
            <th className="p-3 border">Price</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-3 border">{item.Symbol}</td>
              <td className="p-3 border text-green-600 font-semibold">
                {item.Profit}
              </td>
              <td className="p-3 border">{item.Volume}</td>
              <td className="p-3 border">{item.Price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SimpleDeals;
