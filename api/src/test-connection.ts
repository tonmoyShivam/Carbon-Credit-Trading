import * as dotenv from 'dotenv';
dotenv.config();
import { getContractAs } from './services/fabricConnection';

async function main() {
  const contract = await getContractAs('CarbonAuthority');
  const result = await contract.evaluateTransaction('verifyCredits', 'CREDIT003');
  console.log(Buffer.from(result).toString('utf8'));
  process.exit(0);
}

main().catch((err) => {
  console.error('Connection test failed:', err);
  process.exit(1);
});