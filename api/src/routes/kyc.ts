import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../services/db';
import { pinata } from '../services/pinata';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', requireAuth, upload.single('document'), async (req: AuthedRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const file = new File([req.file.buffer], req.file.originalname, { type: req.file.mimetype });
    const result = await pinata.upload.public.file(file);
    await prisma.organization.update({
      where: { id: req.user!.organizationId },
      data: { kycDocumentCid: result.cid, kycStatus: 'Pending' },
    });
    res.json({ cid: result.cid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.user!.organizationId } });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json({ kycStatus: org.kycStatus, kycDocumentCid: org.kycDocumentCid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pending', requireAuth, requireRole('regulator'), async (req: AuthedRequest, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      where: { kycStatus: 'Pending', id: { not: req.user!.organizationId } },
      select: { id: true, name: true, role: true, kycStatus: true, kycDocumentCid: true, createdAt: true },
    });
    res.json(orgs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:orgId/approve', requireAuth, requireRole('regulator'), async (req: AuthedRequest, res) => {
  if (req.params.orgId === req.user!.organizationId) {
    return res.status(403).json({ error: 'Regulators cannot approve their own organization' });
  }
  try {
    const org = await prisma.organization.update({
      where: { id: req.params.orgId },
      data: { kycStatus: 'Approved' },
    });
    res.json({ message: `${org.id} approved`, kycStatus: org.kycStatus });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:orgId/reject', requireAuth, requireRole('regulator'), async (req: AuthedRequest, res) => {
  if (req.params.orgId === req.user!.organizationId) {
    return res.status(403).json({ error: 'Regulators cannot reject their own organization' });
  }
  try {
    const org = await prisma.organization.update({
      where: { id: req.params.orgId },
      data: { kycStatus: 'Rejected' },
    });
    res.json({ message: `${org.id} rejected`, kycStatus: org.kycStatus });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
