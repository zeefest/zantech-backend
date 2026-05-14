import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { generateToken } from '../utils/generateToken.js';

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, phone, password, role, adminSecret } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ message: 'All fields required' });

    // Admin secret check
    if (role === 'Admin' && adminSecret !== process.env.ADMIN_SECRET)
      return res.status(403).json({ message: 'Invalid admin secret key' });

    const exists = await pool.query('SELECT id FROM users WHERE phone=$1', [phone]);
    if (exists.rows.length) return res.status(400).json({ message: 'Phone already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const finalRole = role === 'Admin' ? 'Admin' : 'Customer';
    const { rows } = await pool.query(
      'INSERT INTO users (name, phone, password, role) VALUES ($1,$2,$3,$4) RETURNING id,name,phone,role',
      [name, phone, hashed, finalRole]
    );
    const user = rows[0];
    res.status(201).json({ ...user, token: generateToken(user.id, user.role) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE phone=$1', [phone]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({
      id: user.id, name: user.name, phone: user.phone, role: user.role,
      token: generateToken(user.id, user.role)
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    let query = 'UPDATE users SET name=$1', params = [name];
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query += ', password=$2'; params.push(hashed);
    }
    query += ` WHERE id=$${params.length + 1} RETURNING id,name,phone,role`;
    params.push(req.user.id);
    const { rows } = await pool.query(query, params);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};