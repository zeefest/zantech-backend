// routes/userRoutes.js
import { Router } from 'express';
import * as c from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
const r = Router();
r.get('/', protect, adminOnly, c.getAllUsers);
r.delete('/:id', protect, adminOnly, c.deleteUser);
export default r;