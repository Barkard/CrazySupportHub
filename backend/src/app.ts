import express from 'express';
import type { Request, Response, Express } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';

const app: Express = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Rutas del sistema
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);


export default app;