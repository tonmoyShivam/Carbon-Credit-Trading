import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import creditsRouter from './routes/credits';
import kycRouter from './routes/kyc';
import listingsRouter from './routes/listings';
import { startEventListener } from './services/eventListener';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/credits', creditsRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/listings', listingsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));

startEventListener().catch((err) => console.error('Event listener crashed:', err));
