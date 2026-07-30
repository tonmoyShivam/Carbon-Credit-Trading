import { Router } from 'express';
import { prisma } from '../services/db';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { organizationId: req.user!.organizationId } });
    res.json(wallet ?? { organizationId: req.user!.organizationId, balance: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
