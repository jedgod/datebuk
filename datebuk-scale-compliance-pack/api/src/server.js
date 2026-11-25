import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { notificationRouter } from './notifications/routes.js';
import { paymentRouter } from './payments/routes.js';
import { moderationRouter } from './moderation/routes.js';
import { analyticsRouter } from './analytics/routes.js';
import { complianceRouter } from './compliance/routes.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'datebuk-scale-compliance-api' }));
app.use('/api/notifications', notificationRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/compliance', complianceRouter);

const port = process.env.PORT || 5050;
app.listen(port, () => console.log(`DateBuk API running on ${port}`));
