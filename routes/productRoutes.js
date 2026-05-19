


import { Router } from 'express';
import * as c from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// 1. Cloudinary Configuration 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Cloudinary Storage Setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'zantech_mart_products', // Cloudinary par is naam ka folder banega
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

const r = Router();

r.get('/', c.getProducts);
r.get('/all', protect, adminOnly, c.getAllProducts);
r.get('/related/:id', c.getRelatedProducts);
r.get('/:id', c.getProductById);

// Baqi routes bilkul same rahenge
r.post('/', protect, adminOnly, upload.single('image'), c.createProduct);
r.put('/:id', protect, adminOnly, upload.single('image'), c.updateProduct);

r.delete('/:id', protect, adminOnly, c.deleteProduct);

export default r;