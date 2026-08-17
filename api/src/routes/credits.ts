import { Router } from 'express';
import { prisma } from '../services/db';
import { getContractAs } from '../services/fabricConnection';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';

const router = Router();

router.post('/issue', requireAuth, requireRole('regulator'), async (req: AuthedRequest, res) => {
  const { creditId, owner, amount, sourceProject, issueDate, expiryDate, contentHash } = req.body;
  try {
    const contract = await getContractAs(req.user!.organizationId);
    await contract.submitTransaction(
      'issueCarbonCredits', creditId, owner, String(amount), sourceProject, issueDate, expiryDate, contentHash,
    );
    res.status(201).json({ message: 'Credit issued', creditId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:creditId/transfer', requireAuth, async (req: AuthedRequest, res) => {
  const { newOwner, price } = req.body;
  try {
    const buyerOrg = await prisma.organization.findUnique({ where: { id: newOwner } });
    if (!buyerOrg) {
      return res.status(400).json({ error: `Organization '${newOwner}' does not exist` });
    }

    const buyerWallet = await prisma.wallet.findUnique({ where: { organizationId: newOwner } });
    if (!buyerWallet || buyerWallet.balance < price) {
      return res.status(400).json({ error: 'Buyer has insufficient balance' });
    }

    const contract = await getContractAs(req.user!.organizationId);
    await contract.submitTransaction('transferCredits', req.params.creditId, newOwner, String(price));

    await prisma.$transaction([
      prisma.wallet.update({
        where: { organizationId: newOwner },
        data: { balance: { decrement: price } },
      }),
      prisma.wallet.update({
        where: { organizationId: req.user!.organizationId },
        data: { balance: { increment: price } },
      }),
    ]);

    res.json({ message: 'Credit transferred' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:creditId/retire', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const contract = await getContractAs(req.user!.organizationId);
    await contract.submitTransaction('retireCredits', req.params.creditId);
    res.json({ message: 'Credit retired' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:creditId/verify', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const contract = await getContractAs(req.user!.organizationId);
    const result = await contract.evaluateTransaction('verifyCredits', req.params.creditId);
    res.json(JSON.parse(Buffer.from(result).toString('utf8')));
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/balance/:ownerId', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const contract = await getContractAs(req.user!.organizationId);
    const result = await contract.evaluateTransaction('getBalance', req.params.ownerId);
    res.json(JSON.parse(Buffer.from(result).toString('utf8')));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:creditId/history', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const contract = await getContractAs(req.user!.organizationId);
    const result = await contract.evaluateTransaction('getTransactionHistory', req.params.creditId);
    res.json(JSON.parse(Buffer.from(result).toString('utf8')));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
