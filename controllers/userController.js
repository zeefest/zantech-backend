// userController.js
import pool from '../config/db.js';
export const getAllUsers = async (_, res) => {
  const { rows } = await pool.query('SELECT id,name,phone,role,created_at FROM users ORDER BY id DESC');
  res.json(rows);
};
export const deleteUser = async (req, res) => {
  await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ message: 'User deleted' });
};