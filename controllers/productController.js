
import pool from '../config/db.js';
import { v2 as cloudinary } from 'cloudinary';

// GET /api/products (Public)
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

// GET /api/products/all (Admin)
export const getAllProducts = async (_, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/products/related/:id
export const getRelatedProducts = async (req, res) => {
  try {
    const prod = await pool.query('SELECT category FROM products WHERE id=$1', [req.params.id]);
    if (!prod.rows.length) return res.json([]);
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE category=$1 AND id<>$2 AND is_listed=TRUE LIMIT 4',
      [prod.rows[0].category, req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const { name, purchase_price, sales_price, description, category, stock } = req.body;
    
    // Cloudinary upload hone ke baad secure link automatic 'req.file.path' mein milta hai
    const image_url = req.file ? req.file.path : '';

    const { rows } = await pool.query(
      `INSERT INTO products (name, purchase_price, sales_price, description, category, image_url, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, purchase_price, sales_price, description, category, image_url, stock || 100]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, purchase_price, sales_price, description, category, stock, is_listed } = req.body;

    const oldP = await pool.query('SELECT image_url FROM products WHERE id=$1', [id]);
    let finalImg = oldP.rows[0]?.image_url;

    if (req.file) {
      finalImg = req.file.path; // Naya Cloudinary URL

      // [Optional] Agar Cloudinary se purani file delete karni ho:
      const oldUrl = oldP.rows[0]?.image_url;
      if (oldUrl && oldUrl.includes('cloudinary')) {
        try {
          // URL se public_id nikalna (e.g., zantech_mart_products/filename)
          const urlParts = oldUrl.split('/');
          const folderWithFile = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1].split('.')[0];
          await cloudinary.uploader.destroy(folderWithFile);
        } catch (cloudErr) {
          console.log("Purani image cloud se delete nahi ho saki:", cloudErr.message);
        }
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

// DELETE PRODUCT (Soft Delete)
export const deleteProduct = async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_listed=FALSE WHERE id=$1', [req.params.id]);
    res.json({ message: 'Product unlisted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};