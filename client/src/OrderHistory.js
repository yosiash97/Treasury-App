import React, { useState, useEffect } from "react";

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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
  },
  backButton: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #213055",
    background: "#0f1630",
    color: "#e6e9ef",
    cursor: "pointer",
    fontSize: 14,
    textDecoration: "none",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 16,
    tableLayout: "fixed", // This makes columns use equal width
  },
  th: {
    background: "#0f1630",
    padding: "12px 16px",
    textAlign: "left",
    borderBottom: "1px solid #213055",
    fontWeight: 600,
    fontSize: 14,
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #213055",
    fontSize: 14,
    wordWrap: "break-word", // Handle long content
  },
  tr: {
    transition: "background-color 0.2s",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#bac2de",
    fontSize: 16,
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
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    background: "#0f1630",
    border: "1px solid #213055",
    borderRadius: 8,
    padding: 16,
    textAlign: "center",
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 600,
    color: "#60a5fa",
  },
};

export default function OrderHistory({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleBackClick = () => {
    if (onBack && typeof onBack === 'function') {
      onBack();
    } else {
      console.error('onBack is not a function!', onBack);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const baseApi = process.env.REACT_APP_BASE_API;
      const res = await fetch(`${baseApi}/orders`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      setError('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Calculate summary stats
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, order) => sum + Number(order.amount), 0);
  const avgAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.loading}>Loading order history...</div>
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
            <button onClick={fetchOrders} style={styles.backButton}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Order History</h1>
          <button 
            onClick={handleBackClick}
            style={styles.backButton}
          >
            ← Back to Yield Curve
          </button>
        </div>

        {/* Summary Cards */}
        <div style={styles.summary}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Orders</div>
            <div style={styles.summaryValue}>{totalOrders}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Amount</div>
            <div style={styles.summaryValue}>{formatCurrency(totalAmount)}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Average Order</div>
            <div style={styles.summaryValue}>{formatCurrency(avgAmount)}</div>
          </div>
        </div>

        {/* Orders Table */}
        {totalOrders > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Term</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Date Submitted</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr 
                  key={order.id} 
                  style={styles.tr}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#0f1630";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <td style={styles.td}>#{order.id}</td>
                  <td style={styles.td}>{order.term} Week</td>
                  <td style={styles.td}>{formatCurrency(order.amount)}</td>
                  <td style={styles.td}>{formatDate(order.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>
            <p>No orders submitted yet.</p>
            <p>Place your first order using the yield curve interface.</p>
          </div>
        )}
      </div>
    </div>
  );
}