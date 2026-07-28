import { Router } from 'express';
import { prisma } from '../services/db';
import { getContractAs } from '../services/fabricConnection';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const listings = await prisma.marketplaceListing.findMany({
      include: { credit: true, seller: true },
      orderBy: { listedAt: 'desc' },
    });
    res.json(listings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const { creditId, askPrice } = req.body;
  try {
    const contract = await getContractAs(req.user!.organizationId);
    const result = await contract.evaluateTransaction('verifyCredits', creditId);
    const credit = JSON.parse(Buffer.from(result).toString('utf8'));

    if (credit.owner !== req.user!.organizationId) {
      return res.status(403).json({ error: 'You do not own this credit' });
    }
    if (credit.status === 'Retired') {
      return res.status(400).json({ error: 'Retired credits cannot be listed' });
    }

    const listing = await prisma.marketplaceListing.create({
      data: { creditId, sellerId: req.user!.organizationId, askPrice },
    });
    res.status(201).json(listing);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/requests', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const requests = await prisma.purchaseRequest.findMany({
      where: { listing: { sellerId: req.user!.organizationId } },
      include: { listing: { include: { credit: true } }, buyer: true },
      orderBy: { requestedAt: 'desc' },
    });
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/requests/:reqId/accept', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: req.params.reqId },
      include: { listing: true },
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.listing.sellerId !== req.user!.organizationId) {
      return res.status(403).json({ error: 'Not your listing' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ error: `Request is already ${request.status}` });
    }

    const contract = await getContractAs(req.user!.organizationId);
    await contract.submitTransaction(
      'transferCredits',
      request.listing.creditId,
      request.buyerId,
      String(request.listing.askPrice),
    );

    await prisma.$transaction([
      prisma.purchaseRequest.deleteMany({ where: { listingId: request.listingId } }),
      prisma.marketplaceListing.delete({ where: { id: request.listingId } }),
    ]);

    res.json({ message: 'Purchase accepted, credit transferred' });
  } catch (err: any) {
    console.error('=== Accept purchase request failed ===');
    console.error('message:', err.message);
    console.error('details:', JSON.stringify(err.details, null, 2));
    console.error('cause:', err.cause);
    console.error('full error object:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/requests/:reqId/reject', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: req.params.reqId },
      include: { listing: true },
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.listing.sellerId !== req.user!.organizationId) {
      return res.status(403).json({ error: 'Not your listing' });
    }
    await prisma.purchaseRequest.update({
      where: { id: request.id },
      data: { status: 'Rejected', respondedAt: new Date() },
    });
    res.json({ message: 'Request rejected' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId !== req.user!.organizationId) {
      return res.status(403).json({ error: 'Not your listing' });
    }
    await prisma.$transaction([
      prisma.purchaseRequest.deleteMany({ where: { listingId: req.params.id } }),
      prisma.marketplaceListing.delete({ where: { id: req.params.id } }),
    ]);
    res.json({ message: 'Listing cancelled' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/request', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId === req.user!.organizationId) {
      return res.status(400).json({ error: 'Cannot buy your own listing' });
    }

    const request = await prisma.purchaseRequest.create({
      data: { listingId: listing.id, buyerId: req.user!.organizationId },
    });
    res.status(201).json(request);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
