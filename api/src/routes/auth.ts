import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/db';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, organizationId, fabricRole } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, organizationId, fabricRole } });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { userId: user.id, organizationId: user.organizationId, fabricRole: user.fabricRole },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' },
  );
  res.json({ token });
});

export default router;
