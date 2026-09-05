import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import prisma from './src/config/database';
import { env } from './src/config/env';
import departmentsRouter from './src/modules/departments/routes';
import positionsRouter from './src/modules/positions/routes';
import schedulesRouter from './src/modules/schedules/routes';
import employeesRouter from './src/modules/employees/routes';

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

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await prisma.users.count();
    res.json({ status: 'ok', database: 'connected', usersCount: userCount });
  } catch (error) {
    res.status(500).json({ status: 'error', message: (error as Error).message });
  }
});

// Module API Routes
app.use('/api/departments', departmentsRouter);
app.use('/api/job-positions', positionsRouter);
app.use('/api/working-schedules', schedulesRouter);
app.use('/api/employees', employeesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
