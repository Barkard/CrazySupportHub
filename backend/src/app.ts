import express from 'express';
import type { Request, Response, Express } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import userRoutes from './routes/user.routes.js';

const app: Express = express();

const allowedOrigins = [
  'https://crazy-support-hub.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Permitir cualquier subdominio de Vercel o los orígenes explícitos
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    
    return callback(null, true); // Permisivo en desarrollo / producción para evitar bloqueos
  },
  credentials: true,
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