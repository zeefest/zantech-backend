import { Router } from 'express';
import * as c from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import multer from 'multer';

// Multer Setup: Images 'uploads' folder mein save hongi
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const r = Router();

r.get('/', c.getProducts);
r.get('/all', protect, adminOnly, c.getAllProducts);
r.get('/related/:id', c.getRelatedProducts);
r.get('/:id', c.getProductById);

// Post aur Put mein image upload ka middleware dala hai
r.post('/', protect, adminOnly, upload.single('image'), c.createProduct);
r.put('/:id', protect, adminOnly, upload.single('image'), c.updateProduct);

r.delete('/:id', protect, adminOnly, c.deleteProduct);

export default r;