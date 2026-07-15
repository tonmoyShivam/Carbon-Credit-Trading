# Chaincode API Reference

| Function | Args | Caller | Type |
|---|---|---|---|
| `issueCarbonCredits` | creditId, owner, amount, sourceProject, issueDate, expiryDate, contentHash | regulator | submit |
| `transferCredits` | creditId, newOwner, price | current owner | submit |
| `retireCredits` | creditId | current owner | submit |
| `verifyCredits` | creditId | anyone | evaluate |
| `getBalance` | ownerId | anyone (API should scope to caller in prod) | evaluate |
| `getTransactionHistory` | creditId | anyone | evaluate |

## Test identities (Fabric CA)

| Identity | Org | role attr | orgName attr | Secret |
|---|---|---|---|---|
| regulator1 | Org1 | regulator | CarbonAuthority | regulator1pw |
| company1 | Org2 | company | company1 | company1pw |
| company2 | Org2 | company | company2 | company2pw |

## Credits issued during Week 1 testing

| Credit ID | Status | History |
|---|---|---|
| CREDIT001 | Retired | Issued→company1, transferred→company2, retired by company2 |
| CREDIT003 | Issued | Owned by company1 |
