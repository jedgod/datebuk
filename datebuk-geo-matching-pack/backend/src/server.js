import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { geoRouter } from './geo/geo.routes.js';
import { matchRouter } from './matches/match.routes.js';
import { privacyRouter } from './privacy/privacy.routes.js';
import { adminRegionRouter } from './admin/adminRegion.routes.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true, service: 'DateBuk Geo Matching API' }));
app.use('/api/geo', geoRouter);
app.use('/api/matches', matchRouter);
app.use('/api/privacy/location', privacyRouter);
app.use('/api/admin/regions', adminRegionRouter);

const port = process.env.PORT || 5050;
app.listen(port, () => console.log(`Geo API running on ${port}`));
