import { connect, Contract, Gateway, Identity, Network, Signer, signers } from '@hyperledger/fabric-gateway';
import * as grpc from '@grpc/grpc-js';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

const CHANNEL_NAME = 'mychannel';
const CHAINCODE_NAME = 'carboncc';

interface OrgConfig {
  mspId: string;
  identityPath: string;
  peerEndpoint: string;
  tlsCertPath: string;
  peerHostAlias: string;
}

const ORG_CONFIG: Record<string, OrgConfig> = {
  CarbonAuthority: {
    mspId: 'Org1MSP',
    identityPath: 'organizations/peerOrganizations/org1.example.com/users/regulator1@org1.example.com/msp',
    peerEndpoint: 'localhost:7051',
    tlsCertPath: 'organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt',
    peerHostAlias: 'peer0.org1.example.com',
  },
  company1: {
    mspId: 'Org2MSP',
    identityPath: 'organizations/peerOrganizations/org2.example.com/users/company1@org2.example.com/msp',
    peerEndpoint: 'localhost:9051',
    tlsCertPath: 'organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt',
    peerHostAlias: 'peer0.org2.example.com',
  },
  company2: {
    mspId: 'Org2MSP',
    identityPath: 'organizations/peerOrganizations/org2.example.com/users/company2@org2.example.com/msp',
    peerEndpoint: 'localhost:9051',
    tlsCertPath: 'organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt',
    peerHostAlias: 'peer0.org2.example.com',
  },
};

const gatewayCache = new Map<string, Gateway>();

function testNetworkRoot(): string {
  const p = process.env.FABRIC_TEST_NETWORK_PATH;
  if (!p) throw new Error('FABRIC_TEST_NETWORK_PATH is not set in api/.env');
  return p;
}

async function buildGateway(orgId: string): Promise<Gateway> {
  const cfg = ORG_CONFIG[orgId];
  if (!cfg) throw new Error(`No Fabric identity configured for org "${orgId}"`);
  const root = testNetworkRoot();

  const tlsRootCert = await fs.readFile(path.join(root, cfg.tlsCertPath));
  const client = new grpc.Client(cfg.peerEndpoint, grpc.credentials.createSsl(tlsRootCert), {
    'grpc.ssl_target_name_override': cfg.peerHostAlias,
  });

  const certDir = path.join(root, cfg.identityPath, 'signcerts');
  const certFile = (await fs.readdir(certDir))[0];
  const credentials = await fs.readFile(path.join(certDir, certFile));
  const identity: Identity = { mspId: cfg.mspId, credentials };

  const keyDir = path.join(root, cfg.identityPath, 'keystore');
  const keyFile = (await fs.readdir(keyDir))[0];
  const privateKeyPem = await fs.readFile(path.join(keyDir, keyFile));
  const signer: Signer = signers.newPrivateKeySigner(crypto.createPrivateKey(privateKeyPem));

  return connect({ client, identity, signer });
}

export async function getNetworkAs(orgId: string): Promise<Network> {
  let gateway = gatewayCache.get(orgId);
  if (!gateway) {
    gateway = await buildGateway(orgId);
    gatewayCache.set(orgId, gateway);
  }
  return gateway.getNetwork(CHANNEL_NAME);
}

export async function getContractAs(orgId: string): Promise<Contract> {
  const network = await getNetworkAs(orgId);
  return network.getContract(CHAINCODE_NAME);
}