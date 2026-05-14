// routes/cartRoutes.js
import { Router } from 'express';
import * as c from '../controllers/cartController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
const r = Router();
r.get('/',     protect, c.getMyCart);
r.post('/',    protect, c.addToCart);
r.put('/:id',  protect, c.updateCartItem);
r.delete('/:id', protect, c.removeFromCart);
r.get('/live', protect, adminOnly, c.getLiveCarts);
export default r;