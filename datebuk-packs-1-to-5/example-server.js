const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ app: 'DateBuk Packs 1-5 API', status: 'running' }));

// Mount pack routers manually after copying into your API app.
// Example:
// app.use('/api/trust-safety', require('./pack-1-trust-safety/api/1_trust_safetyRoutes'));

app.listen(5000, () => console.log('DateBuk pack API running on http://localhost:5000'));
