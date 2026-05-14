import pool from '../config/db.js';

import fs from 'fs';
import path from 'path';

// GET /api/products  (public — only listed)
export const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    let q = 'SELECT * FROM products WHERE is_listed=TRUE';
    const params = [];
    if (search)   { params.push(`%${search}%`);  q += ` AND name ILIKE $${params.length}`; }
    if (category) { params.push(category);        q += ` AND category=$${params.length}`; }
    if (minPrice) { params.push(minPrice);        q += ` AND sales_price>=$${params.length}`; }
    if (maxPrice) { params.push(maxPrice);        q += ` AND sales_price<=$${params.length}`; }
    q += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/products/all   (admin — includes unlisted)
export const getAllProducts = async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY id DESC');
  res.json(rows);
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Product not found' });
  res.json(rows[0]);
};

// GET /api/products/related/:id
export const getRelatedProducts = async (req, res) => {
  const prod = await pool.query('SELECT category FROM products WHERE id=$1', [req.params.id]);
  if (!prod.rows.length) return res.json([]);
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE category=$1 AND id<>$2 AND is_listed=TRUE LIMIT 4',
    [prod.rows[0].category, req.params.id]
  );
  res.json(rows);
};






export const createProduct = async (req, res) => {
  try {
    const { name, purchase_price, sales_price, description, category, stock } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : '';

    const { rows } = await pool.query(
      `INSERT INTO products (name,purchase_price,sales_price,description,category,image_url,stock)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, purchase_price, sales_price, description, category, image_url, stock || 100]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, purchase_price, sales_price, description, category, stock, is_listed } = req.body;

    const oldP = await pool.query('SELECT image_url FROM products WHERE id=$1', [id]);
    let finalImg = oldP.rows[0]?.image_url;

    if (req.file) {
      finalImg = `/uploads/${req.file.filename}`;
      // Purani file delete karna
      if (oldP.rows[0]?.image_url?.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), oldP.rows[0].image_url.substring(1));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const { rows } = await pool.query(
      `UPDATE products SET name=$1, purchase_price=$2, sales_price=$3, description=$4, 
       category=$5, image_url=$6, stock=$7, is_listed=$8 WHERE id=$9 RETURNING *`,
      [name, purchase_price, sales_price, description, category, finalImg, stock, is_listed, id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Baki controllers (getProducts, deleteProduct etc) wahi rahenge jo pehle the.// DELETE /api/products/:id   → soft delete
export const deleteProduct = async (req, res) => {
  await pool.query('UPDATE products SET is_listed=FALSE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Product unlisted' });
};
