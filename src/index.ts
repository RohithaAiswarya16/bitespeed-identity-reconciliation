import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import identifyRoutes from './routes/identify';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', identifyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Bitespeed Identity Reconciliation Service is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Identify endpoint: http://localhost:${PORT}/identify`);
});