import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import prisma from './src/config/database';
import { env } from './src/config/env';
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

import authRoutes from './src/modules/auth/routes';
import adminUserRoutes from './src/modules/admin/routes';

app.use('/api/auth', authRoutes);
app.use('/api/users', adminUserRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const userCount = await prisma.users.count();
    res.json({ status: 'ok', database: 'connected', usersCount: userCount });
  } catch (error) {
    res.status(500).json({ status: 'error', message: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
