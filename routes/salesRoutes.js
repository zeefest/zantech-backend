// routes/salesRoutes.js
import { Router } from 'express';
import * as c from '../controllers/salesController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
const r = Router();
r.get('/', protect, adminOnly, c.getSales);
r.delete('/reset', protect, adminOnly, c.resetSales);
r.get('/export/excel', protect, adminOnly, c.exportExcel);
r.get('/export/pdf',   protect, adminOnly, c.exportPDF);
export default r;