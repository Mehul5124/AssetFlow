import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AssetFlow Backend! The server is running perfectly. Go to /api for health check.' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'AssetFlow API is running' });
});

import authRoutes from './routes/auth.routes';
import departmentRoutes from './routes/department.routes';
import categoryRoutes from './routes/category.routes';
import employeeRoutes from './routes/employee.routes';
import assetRoutes from './routes/asset.routes';
import allocationRoutes from './routes/allocation.routes';
import transferRoutes from './routes/transfer.routes';
import bookingRoutes from './routes/booking.routes';
import maintenanceRoutes from './routes/maintenance.routes';

// Mount routes here
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
