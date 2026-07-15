import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

interface CarbonCredit {
  docType: 'carbonCredit';
  creditId: string;
  owner: string;               // orgName of current owner
  amount: number;               // tCO2e
  sourceProject: string;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  issueDate: string;
  expiryDate: string;
  status: 'Issued' | 'Listed' | 'Sold' | 'Retired';
  contentHash: string;          // hash of supporting docs pinned on IPFS
}

@Info({ title: 'CarbonCreditContract', description: 'Issuance, trading, and retirement of carbon credits' })
export class CarbonCreditContract extends Contract {

  @Transaction()
  public async issueCarbonCredits(
    ctx: Context,
    creditId: string,
    owner: string,
    amount: number,
    sourceProject: string,
    issueDate: string,
    expiryDate: string,
    contentHash: string,
  ): Promise<void> {
    this.requireRole(ctx, 'regulator');

    if (await this.assetExists(ctx, creditId)) {
      throw new Error(`Credit ${creditId} already exists`);
    }

    const credit: CarbonCredit = {
      docType: 'carbonCredit',
      creditId,
      owner,
      amount,
      sourceProject,
      verificationStatus: 'Verified',
      issueDate,
      expiryDate,
      status: 'Issued',
      contentHash,
    };

    await ctx.stub.putState(creditId, Buffer.from(JSON.stringify(credit)));
    ctx.stub.setEvent('CreditIssued', Buffer.from(JSON.stringify({ creditId, owner, amount })));
  }

  @Transaction()
  public async transferCredits(ctx: Context, creditId: string, newOwner: string, price: number): Promise<void> {
    const credit = await this.readCredit(ctx, creditId);

    if (credit.status === 'Retired') {
      throw new Error(`Credit ${creditId} is retired and cannot change hands`);
    }
    if (credit.owner !== ctx.clientIdentity.getAttributeValue('orgName')) {
      throw new Error('Only the current owner can transfer this credit');
    }

    credit.owner = newOwner;
    credit.status = 'Sold';

    await ctx.stub.putState(creditId, Buffer.from(JSON.stringify(credit)));
    ctx.stub.setEvent('CreditTransferred', Buffer.from(JSON.stringify({ creditId, newOwner, price })));
  }

  @Transaction()
  public async retireCredits(ctx: Context, creditId: string): Promise<void> {
    const credit = await this.readCredit(ctx, creditId);

    if (credit.status === 'Retired') {
      throw new Error(`Credit ${creditId} is already retired`);
    }
    if (credit.owner !== ctx.clientIdentity.getAttributeValue('orgName')) {
      throw new Error('Only the current owner can retire this credit');
    }

    credit.status = 'Retired';
    await ctx.stub.putState(creditId, Buffer.from(JSON.stringify(credit)));
    ctx.stub.setEvent('CreditRetired', Buffer.from(JSON.stringify({ creditId })));
  }

  @Transaction(false)
  @Returns('string')
  public async verifyCredits(ctx: Context, creditId: string): Promise<string> {
    return JSON.stringify(await this.readCredit(ctx, creditId));
  }

  @Transaction(false)
  @Returns('string')
  public async getBalance(ctx: Context, ownerId: string): Promise<string> {
    const selector = { selector: { docType: 'carbonCredit', owner: ownerId, status: { $ne: 'Retired' } } };
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(selector));
    const results = [];
    let res = await iterator.next();
    while (!res.done) {
      results.push(JSON.parse(Buffer.from(res.value.value).toString('utf8')));
      res = await iterator.next();
    }
    await iterator.close();
    return JSON.stringify(results);
  }

  @Transaction(false)
  @Returns('string')
  public async getTransactionHistory(ctx: Context, creditId: string): Promise<string> {
    const iterator = await ctx.stub.getHistoryForKey(creditId);
    const history = [];
    let res = await iterator.next();
    while (!res.done) {
      history.push({
        txId: res.value.txId,
        timestamp: res.value.timestamp,
        isDelete: res.value.isDelete,
        value: res.value.value.length > 0 ? JSON.parse(Buffer.from(res.value.value).toString('utf8')) : null,
      });
      res = await iterator.next();
    }
    await iterator.close();
    return JSON.stringify(history);
  }

  private async assetExists(ctx: Context, creditId: string): Promise<boolean> {
    const data = await ctx.stub.getState(creditId);
    return !!data && data.length > 0;
  }

  private async readCredit(ctx: Context, creditId: string): Promise<CarbonCredit> {
    const data = await ctx.stub.getState(creditId);
    if (!data || data.length === 0) {
      throw new Error(`Credit ${creditId} does not exist`);
    }
    return JSON.parse(data.toString()) as CarbonCredit;
  }

  private requireRole(ctx: Context, role: string): void {
    if (ctx.clientIdentity.getAttributeValue('role') !== role) {
      throw new Error(`This action requires the '${role}' role`);
    }
  }
}