// dashboardController.js
import pool from '../config/db.js';

export const getStats = async (req, res) => {
  try {
    // Queries ko parallel chalane ke liye Promise.all use karein (Fast execution)
    const [revenue, profit, active, users] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(total_sales_price), 0) as total FROM sales'),
      pool.query('SELECT COALESCE(SUM(total_profit), 0) as total FROM sales'),
      pool.query("SELECT COUNT(*)::int as c FROM orders WHERE status <> 'Delivered'"),
      pool.query("SELECT COUNT(*)::int as c FROM users WHERE role = 'Customer'")
    ]);

    // Response object ka structure bilkul waisa rakhein jaisa frontend expect kar raha hai
    res.json({
      totalRevenue: parseFloat(revenue.rows[0].total),
      totalProfit: parseFloat(profit.rows[0].total),
      activeOrders: active.rows[0].c,
      totalCustomers: users.rows[0].c,
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: "Internal Server Error in Command Center" });
  }
};