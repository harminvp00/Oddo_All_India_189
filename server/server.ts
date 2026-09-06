import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import prisma from './src/config/database';
import { env } from './src/config/env';
import authRoutes from './src/modules/auth/routes';
import adminUserRoutes from './src/modules/admin/routes';
import departmentsRouter from './src/modules/departments/routes';
import positionsRouter from './src/modules/positions/routes';
import schedulesRouter from './src/modules/schedules/routes';
import attendanceRouter from './src/modules/attendance/routes';
import employeesRouter from './src/modules/employees/routes';
import contractsRouter from './src/modules/contracts/routes';
import timeoffRouter from './src/modules/timeoff/routes';
import payrollRouter from './src/modules/payroll/routes';
import settingsRouter from './src/modules/settings/routes';
import reportsRouter from './src/modules/reports/routes';

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
app.use('/api/auth', authRoutes);
app.use('/api/users', adminUserRoutes);
app.use('/api/departments', departmentsRouter);
app.use('/api/positions', positionsRouter);
app.use('/api/job-positions', positionsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/working-schedules', schedulesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api', timeoffRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api', payrollRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/reports', reportsRouter);



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
