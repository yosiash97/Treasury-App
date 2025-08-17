import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import OrderHistory from './OrderHistory';


const CURVE_FIELDS = [
  { key: "wk4",  label: "4WK",  sortOrder: 4  },
  { key: "wk6",  label: "6WK",  sortOrder: 6  },
  { key: "wk8",  label: "8WK",  sortOrder: 8  },
  { key: "wk13", label: "13WK", sortOrder: 13 },
  { key: "wk17", label: "17WK", sortOrder: 17 },
  { key: "wk26", label: "26WK", sortOrder: 26 },
  { key: "wk52", label: "52WK", sortOrder: 52 },
];

const styles = {
  page: {
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    minHeight: "100vh",
    background: "#0b1020",
    color: "#e6e9ef",
    padding: "24px",
    boxSizing: "border-box",
  },
  card: {
    maxWidth: 1200,
    margin: "0 auto",
    background: "#121a35",
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
    padding: 20,
  },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    gap: 16,
    marginBottom: 20
  },
  title: { fontSize: 22, fontWeight: 700 },
  controls: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  dateSelect: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #213055",
    background: "#0f1630",
    color: "#e6e9ef",
    fontSize: 14,
  },
  refreshButton: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #213055",
    background: "#0f1630",
    color: "#e6e9ef",
    cursor: "pointer",
    fontSize: 14,
    border: "none",
  },
  yieldCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 12,
    marginBottom: 20,
  },
  yieldCard: {
    background: "#0f1630",
    border: "1px solid #213055",
    borderRadius: 8,
    padding: 12,
    textAlign: "center",
  },
  maturityLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  yieldValue: {
    fontSize: 18,
    fontWeight: 600,
    color: "#60a5fa",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    textAlign: "center",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: 16,
    opacity: 0.7,
  },
  error: {
    textAlign: "center",
    padding: "40px",
    fontSize: 16,
    color: "#ef4444",
  },
  noDataInfo: {
    textAlign: "center",
    padding: "40px",
    fontSize: 16,
    color: "#bac2de",
    background: "#0f1630",
    border: "1px solid #213055",
    borderRadius: 8,
  },
  orderForm: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "16px",
    background: "#0f1630",
    border: "1px solid #213055",
    borderRadius: 8,
    marginBottom: 20,
  },
  input: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #213055",
    background: "#121a35",
    color: "#e6e9ef",
    fontSize: 14,
    width: 120,
  },
  select: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #213055",
    background: "#121a35",
    color: "#e6e9ef",
    fontSize: 14,
    width: 150,
  },
  submitButton: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "none",
    background: "#60a5fa",
    color: "#0b1020",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  submitButtonDisabled: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "none",
    background: "#4a5568",
    color: "#a0aec0",
    cursor: "not-allowed",
    fontSize: 14,
    fontWeight: 600,
  },
  buyMessage: {
    textAlign: "center",
    padding: "12px",
    fontSize: 14,
    background: "#0f1630",
    border: "1px solid #213055",
    borderRadius: 8,
    marginBottom: 16,
    color: "#60a5fa",
  }
};

export default function YieldCurveApp() {
  const [treasuryData, setTreasuryData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchingNewData, setFetchingNewData] = useState(false);
  const [error, setError] = useState(null);
  const [noDataMessage, setNoDataMessage] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  
  // Trading states
  const [orderForm, setOrderForm] = useState({ term: '', amount: '' });
  const [isBuying, setIsBuying] = useState(false);
  const [buyMsg, setBuyMsg] = useState('');
  const baseApi = process.env.REACT_APP_BASE_API;

    // Load data on component mount
    useEffect(() => {
      fetchTreasuryData(null, true);
    }, []);
    
  if (showOrderHistory) {
    return <OrderHistory onBack={() => setShowOrderHistory(false)} />;
  }
  // Fetch Treasury data from backend
  const fetchTreasuryData = async (targetDate = null, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setFetchingNewData(true);
      }
      setError(null);
      setNoDataMessage(null);

      const date = targetDate ? new Date(targetDate) : new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const url = `${baseApi}/yields?year=${year}&month=${month}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(res)

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      const data = await res.json();
      const { rows } = data;

      if (!Array.isArray(rows)) {
        throw new Error(`Expected rows to be an array, got ${typeof rows}`);
      }

      setTreasuryData(rows);
      
      if (rows.length > 0) {
        const latestDate = rows[rows.length - 1].date;
        setSelectedDate(latestDate);
        setNoDataMessage(null);
      } else {
        setNoDataMessage("No Treasury data available for this period. Markets are closed on weekends and holidays.");
      }
    } catch (err) {
      setError(`Failed to load Treasury data: ${err.message}`);
    } finally {
      setLoading(false);
      setFetchingNewData(false);
    }
  };
  // this will allow user to make buy order, POST request to backend
  // we store light weight data about order so user can look up later.
  const handleBuy = async () => {
    if (!orderForm.term || !orderForm.amount) {
      setBuyMsg('Please enter both term and amount.');
      return;
    }
    
    setIsBuying(true);
    setBuyMsg('');
    
    try {
      const url = `${baseApi}/orders`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: Number(orderForm.term),
          amount: Number(orderForm.amount),
          date: selectedDate,
        }),
      });

      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      setBuyMsg(`Order placed for $${orderForm.amount} ${orderForm.term} wks. Treasury${data?.id ? ` (Order ID: ${data.id})` : ''}.`);
      setOrderForm({ term: '', amount: '' }); // Clear form
    } catch (e) {
      setBuyMsg('Order failed. Please try again.');
    } finally {
      setIsBuying(false);
    }
  };

  // Convert selected date data to yield curve format
  const getYieldCurveData = () => {
    const row = treasuryData.find((d) => d.date === selectedDate);
    
    if (!row) return [];
  
    const curveData = CURVE_FIELDS
      .map(({ key, label, sortOrder }) => ({
        maturity: label,
        yield: Number(row[key] ?? 0),
        sortOrder,
      }))
      .filter((d) => d.yield > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder);
      
    return curveData;
  };

  const yieldCurveData = getYieldCurveData();
  const selectedDateData = treasuryData.find(d => d.date === selectedDate);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.loading}>Loading Treasury data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.error}>
            {error}
            <br />
            <button style={styles.refreshButton} onClick={() => fetchTreasuryData(null, false)}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (noDataMessage) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.title}>US Treasury Yield Curve</div>
            <div style={styles.controls}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  if (!newDate) return;
                  
                  const selectedDateTime = new Date(newDate);
                  fetchTreasuryData(selectedDateTime, false);
                }}
                style={styles.dateSelect}
              />
              <button style={styles.refreshButton} onClick={() => fetchTreasuryData(null, false)}>
                Refresh
              </button>
            </div>
          </div>
          <div style={styles.noDataInfo}>
            {noDataMessage}
            <br /><br />
            <span style={{ fontSize: 14, opacity: 0.8 }}>
              Try selecting a different date when markets were open.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.title}>US Treasury Yield Curve</div>
          <div style={styles.controls}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const newDate = e.target.value;
                if (!newDate) return;
                
                const selectedDateTime = new Date(newDate);
                const selectedYear = selectedDateTime.getFullYear();
                const selectedMonth = selectedDateTime.getMonth() + 1;
                
                const currentDataYear = treasuryData.length > 0 
                  ? new Date(treasuryData[0].date).getFullYear() 
                  : null;
                const currentDataMonth = treasuryData.length > 0 
                  ? new Date(treasuryData[treasuryData.length - 1].date).getMonth() + 1
                  : null;

                if (selectedYear !== currentDataYear || selectedMonth !== currentDataMonth) {
                  fetchTreasuryData(selectedDateTime, false);
                } else {
                  setSelectedDate(newDate);
                }
              }}
              style={styles.dateSelect}
            />

            <button style={styles.refreshButton} onClick={() => fetchTreasuryData(null, false)}>
              Refresh
            </button>
          </div>
        </div>

        {/* Order Form */}
        <div style={styles.orderForm}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Place Order:</label>
          
          <select
            value={orderForm.term}
            onChange={(e) => setOrderForm(prev => ({ ...prev, term: e.target.value }))}
            style={styles.select}
          >
            <option value="">Select Term</option>
            <option value="4">4 Week</option>
            <option value="6">6 Week</option>
            <option value="8">8 Week</option>
            <option value="13">13 Week</option>
            <option value="17">17 Week</option>
            <option value="26">26 Week</option>
            <option value="52">52 Week</option>
          </select>
          
          <input
            type="number"
            placeholder="Amount ($)"
            value={orderForm.amount}
            onChange={(e) => setOrderForm(prev => ({ ...prev, amount: e.target.value }))}
            style={styles.input}
            min="100"
            step="100"
          />
          
          <button
            onClick={handleBuy}
            disabled={isBuying}
            style={isBuying ? styles.submitButtonDisabled : styles.submitButton}
          >
            {isBuying ? 'Submitting...' : 'Submit Order'}
          </button>
        </div>

        <button 
          style={styles.refreshButton} 
          onClick={() => setShowOrderHistory(true)}
        >
          View Orders
        </button>

        {/* Buy Order Message */}
        {buyMsg && (
          <div style={styles.buyMessage}>
            {buyMsg}
          </div>
        )}

        {/* Current Yields Display */}
        <div style={styles.yieldCards}>
          {CURVE_FIELDS.map(({ key, label }) => (
            <div key={label} style={styles.yieldCard}>
              <div style={styles.maturityLabel}>{label}</div>
              <div style={styles.yieldValue}>
                {selectedDateData && selectedDateData[key] != null
                  ? Number(selectedDateData[key]).toFixed(2)
                  : '0.00'}%
              </div>
            </div>
          ))}
        </div>

        <div style={styles.chartTitle}>
          Yield Curve for {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US') : 'Loading...'}
          {fetchingNewData && <span style={{ color: '#60a5fa', marginLeft: 8 }}>Loading...</span>}
        </div>

        {/* The actual yield curve */}
        <div style={{ width: "100%", height: 400, position: "relative" }}>
          {fetchingNewData && (
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 22, 48, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              borderRadius: 8,
              color: "#60a5fa",
              fontSize: 16
            }}>
              Loading new data...
            </div>
          )}
          <ResponsiveContainer>
            <LineChart 
              data={yieldCurveData} 
              margin={{ top: 20, right: 24, bottom: 40, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#213055" />
              <XAxis 
                dataKey="maturity" 
                tick={{ fill: "#bac2de" }}
                tickMargin={8}
              />
              <YAxis
                domain={["dataMin - 0.1", "dataMax + 0.1"]}
                tick={{ fill: "#bac2de" }}
                tickFormatter={(v) => `${v.toFixed(2)}%`}
              />
              <Tooltip
                contentStyle={{ 
                  background: "#0f1630", 
                  border: "1px solid #213055", 
                  borderRadius: 8 
                }}
                labelStyle={{ color: "#e6e9ef" }}
                formatter={(value, name) => [`${value.toFixed(3)}%`, "Yield"]}
                labelFormatter={(label) => `Maturity: ${label}`}
              />
              
              <Line 
                type="monotone" 
                dataKey="yield" 
                stroke="#60a5fa" 
                strokeWidth={3} 
                dot={{ fill: "#60a5fa", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: "#60a5fa", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7, textAlign: "center" }}>
          This shows the yield curve (interest rates vs. time to maturity) for a single date.
          <br />
          Use the date selector to see how the curve shape changes over time.
        </div>
      </div>
    </div>
  );
}