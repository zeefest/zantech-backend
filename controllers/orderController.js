import pool from '../config/db.js';

// POST /api/orders
export const placeOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { payment_method } = req.body;
    const userId = req.user.id;

    // Fetch cart with profit info
    const cart = await client.query(
      `SELECT c.product_id, c.quantity, p.sales_price, p.purchase_price
       FROM carts c JOIN products p ON c.product_id=p.id
       WHERE c.user_id=$1`, [userId]);
    if (!cart.rows.length) throw new Error('Cart is empty');

    let totalAmount = 0, totalProfit = 0;
    cart.rows.forEach(r => {
      totalAmount += Number(r.sales_price) * r.quantity;
      totalProfit += (Number(r.sales_price) - Number(r.purchase_price)) * r.quantity;
    });




    // Create order
    const order = await client.query(
      `INSERT INTO orders (user_id,total_amount,payment_method)
       VALUES ($1,$2,$3) RETURNING *`,
      [userId, totalAmount, payment_method]);
    const orderId = order.rows[0].id;

    // Insert order_items
    for (const item of cart.rows) {
      await client.query(
        `INSERT INTO order_items (order_id,product_id,quantity,price_at_purchase)
         VALUES ($1,$2,$3,$4)`,
        [orderId, item.product_id, item.quantity, item.sales_price]);
    }

    // Create sales record
    await client.query(
      `INSERT INTO sales (order_id,total_sales_price,total_profit) VALUES ($1,$2,$3)`,
      [orderId, totalAmount, totalProfit]);

    // Clear cart
    await client.query('DELETE FROM carts WHERE user_id=$1', [userId]);

    await client.query('COMMIT');
    res.status(201).json({ ...order.rows[0], message: 'Order placed' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally { client.release(); }
};

// GET /api/orders/mine
export const getMyOrders = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
  res.json(rows);
};

// GET /api/orders/:id  (with items — accessible by owner or admin)
export const getOrderById = async (req, res) => {
  const order = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
  if (!order.rows.length) return res.status(404).json({ message: 'Not found' });
  if (req.user.role !== 'Admin' && order.rows[0].user_id !== req.user.id)
    return res.status(403).json({ message: 'Forbidden' });

  const items = await pool.query(
    `SELECT oi.*, p.name, p.image_url
     FROM order_items oi JOIN products p ON oi.product_id=p.id
     WHERE oi.order_id=$1`, [req.params.id]);
  const user = await pool.query('SELECT name,phone FROM users WHERE id=$1', [order.rows[0].user_id]);
  res.json({ ...order.rows[0], items: items.rows, customer: user.rows[0] });
};

// GET /api/orders  (Admin all)
export const getAllOrders = async (_, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.phone
     FROM orders o JOIN users u ON o.user_id=u.id
     ORDER BY o.created_at DESC`);
  res.json(rows);
};



export const handleReset = async (req, res) => {
  try {
    // Orders table khali karein
    await pool.query('TRUNCATE TABLE orders RESTART IDENTITY CASCADE');
    
    // Success response bhejein
    res.json({ message: 'Orders reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error occurred' });
  }
};
// PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['Confirmed','Packaging','Dispatched','Delivered'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const { rows } = await pool.query(
    'UPDATE orders SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
  res.json(rows[0]);
};