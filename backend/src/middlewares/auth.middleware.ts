import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

interface JwtPayload {
  id: number;
  email: string;
  role: Role;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. Verificar si viene con el secreto de n8n / webhook compartido
  const expectedSecret = process.env.N8N_CALLBACK_SECRET || 'secreto_compartido_para_n8n';
  const providedSecret =
    req.headers['x-callback-secret'] ||
    req.headers['x-n8n-secret'] ||
    (req.body && req.body.secret) ||
    req.query.secret;

  if (providedSecret && providedSecret === expectedSecret) {
    req.user = {
      id: 1,
      email: 'system@n8n.automation',
      role: Role.admin,
    };
    return next();
  }

  // 2. Si no es n8n con secreto, verificar header Authorization con Bearer JWT
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  const secret = process.env.JWT_SECRET || 'fallback_secret';

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes para realizar esta acción' });
    }

    next();
  };
};