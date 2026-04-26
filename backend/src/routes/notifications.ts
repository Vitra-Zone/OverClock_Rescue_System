import { Router, Request, Response } from 'express';
import { requireStaffAuth } from '../middleware/auth';
import { registerStaffNotificationToken } from '../services/notificationService';

const router = Router();

router.post('/register-token', requireStaffAuth, async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing token',
      timestamp: new Date().toISOString(),
    });
  }

  await registerStaffNotificationToken(token);

  res.json({
    success: true,
    data: { registered: true },
    timestamp: new Date().toISOString(),
  });
});

export default router;
