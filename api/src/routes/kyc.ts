import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../services/db';
import { pinata } from '../services/pinata';
import { requireAuth, AuthedRequest } from '../middleware/auth';

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

export default router;
