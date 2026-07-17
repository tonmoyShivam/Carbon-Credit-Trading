import { prisma } from '../src/services/db';

async function main() {
  await prisma.organization.createMany({
    data: [
      { id: 'CarbonAuthority', name: 'Carbon Authority (Regulator)', role: 'regulator', kycStatus: 'Approved' },
      { id: 'company1', name: 'Company One', role: 'company', kycStatus: 'Approved' },
      { id: 'company2', name: 'Company Two', role: 'company', kycStatus: 'Approved' },
    ],
    skipDuplicates: true,
  });
  await prisma.wallet.createMany({
    data: [
      { organizationId: 'CarbonAuthority', balance: 0 },
      { organizationId: 'company1', balance: 100000 },
      { organizationId: 'company2', balance: 100000 },
    ],
    skipDuplicates: true,
  });
  console.log('Seeded organizations + wallets.');
}

main().finally(() => prisma.$disconnect());