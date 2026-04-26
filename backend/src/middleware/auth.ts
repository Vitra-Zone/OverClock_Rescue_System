import { NextFunction, Request, Response } from 'express';
import { getFirebaseAuth } from '../services/firebaseAdmin';

export interface StaffRequest extends Request {
  staffUserId?: string;
  staffEmail?: string;
}

export async function optionalStaffAuth(req: StaffRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.replace('Bearer ', '');
  const auth = getFirebaseAuth();
  if (!auth) return next();

  try {
    const decoded = await auth.verifyIdToken(token);
    req.staffUserId = decoded.uid;
    req.staffEmail = decoded.email;
  } catch {
    // Ignore invalid token in optional mode.
  }

  next();
}

export async function requireStaffAuth(req: StaffRequest, res: Response, next: NextFunction) {
  const auth = getFirebaseAuth();
  const required = process.env.STAFF_AUTH_REQUIRED === 'true';

  if (!required || !auth) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Staff token missing.',
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = await auth.verifyIdToken(token);
    req.staffUserId = decoded.uid;
    req.staffEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Unauthorized. Invalid staff token.',
      timestamp: new Date().toISOString(),
    });
  }
}
