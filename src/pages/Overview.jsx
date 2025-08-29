import React, { useEffect, useState } from "react";
import axios from "../axios";

const Overview = () => {
  const [summary, setSummary] = useState({ netProfit: 0, taxPaid: 0, startingBalance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        console.error("❌ No user_id found in localStorage");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`/summary?user_id=${userId}`);
        setSummary(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">💰 Net Profit</h2>
        <p className="text-3xl font-bold text-lime">
          {loading ? "Loading..." : summary.netProfit.toLocaleString()}
        </p>
      </div>
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">🧾 EA Tax Paid</h2>
        <p className="text-3xl font-bold text-lime">
          {loading ? "Loading..." : summary.taxPaid.toLocaleString()}
        </p>
      </div>
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">🏦 Starting Balance</h2>
        <p className="text-3xl font-bold text-lime">
          {loading ? "Loading..." : summary.startingBalance.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Overview;