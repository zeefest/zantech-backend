// routes/authRoutes.js
import { Router } from 'express';
import { register, login, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
const r = Router();
r.post('/register', register);
r.post('/login', login);
r.put('/profile', protect, updateProfile);
export default r;