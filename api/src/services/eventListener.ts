import { getContractAs, getNetworkAs } from './fabricConnection';
import { prisma } from './db';

export async function startEventListener() {
  const network = await getNetworkAs('CarbonAuthority');
  const events = await network.getChaincodeEvents('carboncc');

  console.log('Event listener started — watching CreditIssued / CreditTransferred / CreditRetired');

  for await (const event of events) {
    const payload = JSON.parse(Buffer.from(event.payload).toString('utf8'));

    try {
      if (event.eventName === 'CreditIssued') {
        const contract = await getContractAs('CarbonAuthority');
        const full = JSON.parse(
          Buffer.from(await contract.evaluateTransaction('verifyCredits', payload.creditId)).toString('utf8'),
        );
        await prisma.carbonCredit.upsert({
          where: { id: full.creditId },
          update: {
            ownerId: full.owner, amount: full.amount, sourceProject: full.sourceProject,
            verificationStatus: full.verificationStatus, status: full.status,
            issueDate: new Date(full.issueDate), expiryDate: new Date(full.expiryDate),
            contentHash: full.contentHash,
          },
          create: {
            id: full.creditId, ownerId: full.owner, amount: full.amount, sourceProject: full.sourceProject,
            verificationStatus: full.verificationStatus, status: full.status,
            issueDate: new Date(full.issueDate), expiryDate: new Date(full.expiryDate),
            contentHash: full.contentHash,
          },
        });
        await prisma.transaction.create({
          data: { txType: 'Issue', creditId: full.creditId, toOrg: full.owner, fabricTxId: event.transactionId },
        });
        console.log(`[synced] Issue ${full.creditId}`);
      }

      if (event.eventName === 'CreditTransferred') {
        await prisma.carbonCredit.update({
          where: { id: payload.creditId },
          data: { ownerId: payload.newOwner, status: 'Sold' },
        });
        await prisma.transaction.create({
          data: {
            txType: 'Transfer', creditId: payload.creditId, toOrg: payload.newOwner,
            price: payload.price, fabricTxId: event.transactionId,
          },
        });
        console.log(`[synced] Transfer ${payload.creditId} -> ${payload.newOwner}`);
      }

      if (event.eventName === 'CreditRetired') {
        await prisma.carbonCredit.update({ where: { id: payload.creditId }, data: { status: 'Retired' } });
        await prisma.transaction.create({
          data: { txType: 'Retire', creditId: payload.creditId, fabricTxId: event.transactionId },
        });
        console.log(`[synced] Retire ${payload.creditId}`);
      }
    } catch (err) {
      console.error(`Failed to sync event ${event.eventName}:`, err);
    }
  }
}
