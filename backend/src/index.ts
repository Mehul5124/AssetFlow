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

// Mount routes here
app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
