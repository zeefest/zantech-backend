// routes/dashboardRoutes.js
import { Router } from 'express';
import { getStats } from '../controllers/dashboardController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
const r = Router();
r.get('/stats', protect, adminOnly, getStats);
export default r;