import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { matchRouter } from './routes/match';
import { safetyRouter } from './routes/safety';
import { ticketRouter } from './routes/tickets';
import { adminRouter } from './routes/admin';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'datebuk-next-level-api' }));
app.use('/api/match', matchRouter);
app.use('/api/safety', safetyRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/admin', adminRouter);

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`DateBuk API running on ${port}`));
