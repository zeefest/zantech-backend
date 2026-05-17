import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes      from './routes/authRoutes.js';
import productRoutes   from './routes/productRoutes.js';
import cartRoutes      from './routes/cartRoutes.js';
import orderRoutes     from './routes/orderRoutes.js';
import salesRoutes     from './routes/salesRoutes.js';
import userRoutes      from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();
const app = express();

// ======================== SAFE CORS STRATEGY (FIXED) ========================
app.use(cors({
  origin: function (origin, callback) {
    // Vercel dashboard ka env variable fetch karein
    const envUrls = process.env.CLIENT_URL || '';
    
    // Comma string ko clean array mein map karein (bina kisi faulty regex ke)
    const allowedOrigins = envUrls.split(',').map(url => url.trim());
    
    // Agar local development ya postman ho (!origin) ya list mein link match ho jaye
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy Blocked: Request origin unauthorized.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/sales',     salesRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (_, res) => res.send('⚡ ZANTECH MART API online'));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server live on port ${PORT}`));