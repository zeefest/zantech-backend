import pool from '../config/db.js';

// GET /api/cart
export const getMyCart = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.quantity, p.id AS product_id, p.name, p.sales_price, p.image_url
     FROM carts c JOIN products p ON c.product_id=p.id
     WHERE c.user_id=$1`, [req.user.id]);
  res.json(rows);
};

// POST /api/cart
export const addToCart = async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO carts (user_id, product_id, quantity)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = carts.quantity + EXCLUDED.quantity
     RETURNING *`, [req.user.id, product_id, quantity]);
  res.status(201).json(rows[0]);
};

// PUT /api/cart/:id
export const updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const { rows } = await pool.query(
    'UPDATE carts SET quantity=$1 WHERE id=$2 AND user_id=$3 RETURNING *',
    [quantity, req.params.id, req.user.id]);
  res.json(rows[0]);
};

// DELETE /api/cart/:id
export const removeFromCart = async (req, res) => {
  await pool.query('DELETE FROM carts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Removed' });
};

// GET /api/cart/live   (Admin live monitor)
export const getLiveCarts = async (_, res) => {
  const { rows } = await pool.query(
    `SELECT u.id user_id, u.name user_name, u.phone,
            p.id product_id, p.name product_name, p.sales_price,
            c.quantity, c.added_at
     FROM carts c
     JOIN users u    ON c.user_id=u.id
     JOIN products p ON c.product_id=p.id
     ORDER BY c.added_at DESC`);
  res.json(rows);
};