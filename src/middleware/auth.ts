import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthedRequest extends Request {
  user?: { userId: string; organizationId: string; fabricRole: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as AuthedRequest['user'];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.fabricRole)) {
      return res.status(403).json({ error: `Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
}