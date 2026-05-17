import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; // DB load kiya
import { errorHandler } from './middleware/errorHandler.js';

// Baqi saare routes imports yahan ayenge...

dotenv.config();
const app = express();

// Database execute karein
connectDB();

// CORS Settings Setup
const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:5173'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy Restriction'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Routes hooks yahan call karein (app.use('/api/auth', authRoutes)...)

app.get('/', (_, res) => res.send('⚡ ZANTECH MART API online'));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));