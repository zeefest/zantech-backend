// routes/orderRoutes.js
import { Router } from 'express';
import * as c from '../controllers/orderController.js';
import { protect, adminOnly  } from '../middleware/authMiddleware.js';
const r = Router();
r.post('/', protect, c.placeOrder);
r.get('/mine', protect, c.getMyOrders);
r.get('/', protect, adminOnly, c.getAllOrders);
r.get('/:id', protect, c.getOrderById);
r.put('/:id/status', protect, adminOnly, c.updateOrderStatus);
r.delete('/reset-all', protect, adminOnly, c.handleReset);
export default r;