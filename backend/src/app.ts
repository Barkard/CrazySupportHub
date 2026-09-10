import express from 'express';
import type { Request, Response, Express } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import userRoutes from './routes/user.routes.js';

const app: Express = express();

app.use(cors({
  origin: [
    'https://crazy-support-hub.vercel.app',
    'https://crazy-support-hub.vercel.app/',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Rutas del sistema
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

export default app;