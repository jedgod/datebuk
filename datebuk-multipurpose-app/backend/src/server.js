const path = require('path');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'datebuk-dev-secret';
const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'datebuk.db');

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  details TEXT,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdBy TEXT,
  updatedAt TEXT,
  updatedBy TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  role TEXT,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  result TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
`);

function seedIfEmpty() {
  const ticketCount = db.prepare('SELECT COUNT(*) AS count FROM tickets').get().count;
  if (ticketCount === 0) {
    const insertTicket = db.prepare(`
      INSERT INTO tickets (id, title, details, priority, status, createdAt, createdBy, updatedAt, updatedBy)
      VALUES (@id, @title, @details, @priority, @status, @createdAt, @createdBy, @updatedAt, @updatedBy)
    `);

    const now = new Date();
    const seedTickets = [
      { id: 'TCK-1902', title: 'Unable to upload verification selfie', details: 'Selfie upload fails with timeout after selecting image.', priority: 'HIGH', status: 'OPEN', createdAt: new Date(now.getTime() - 3600 * 1000).toISOString(), createdBy: 'support.seed', updatedAt: null, updatedBy: null },
      { id: 'TCK-1901', title: 'Refund request for boost add-on', details: 'User says boost was charged twice.', priority: 'NORMAL', status: 'PENDING', createdAt: new Date(now.getTime() - 7200 * 1000).toISOString(), createdBy: 'support.seed', updatedAt: null, updatedBy: null },
      { id: 'TCK-1898', title: 'Message notification delay', details: 'Push arrives 3-5 minutes late on Android devices.', priority: 'NORMAL', status: 'REVIEWING', createdAt: new Date(now.getTime() - 10800 * 1000).toISOString(), createdBy: 'support.seed', updatedAt: null, updatedBy: null },
    ];

    const tx = db.transaction((items) => {
      items.forEach((item) => insertTicket.run(item));
    });

    tx(seedTickets);
  }

  const auditCount = db.prepare('SELECT COUNT(*) AS count FROM audit_logs').get().count;
  if (auditCount === 0) {
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (id, actor, role, action, target, result, createdAt)
      VALUES (@id, @actor, @role, @action, @target, @result, @createdAt)
    `);

    const seedLogs = [
      { id: 'AUD-9001', actor: 'moderator.kemi', role: 'moderator', action: 'REPORT_ESCALATED', target: 'RPT-882', result: 'Escalated to Trust Lead', createdAt: new Date(Date.now() - 3000 * 1000).toISOString() },
      { id: 'AUD-9000', actor: 'system.policy', role: 'system', action: 'RISK_FLAG_APPLIED', target: 'USR-3221', result: 'Temporary visibility restriction', createdAt: new Date(Date.now() - 6000 * 1000).toISOString() },
      { id: 'AUD-8998', actor: 'support.naomi', role: 'support', action: 'TICKET_STATUS_CHANGED', target: 'TCK-1901', result: 'Moved to PENDING_REVIEW', createdAt: new Date(Date.now() - 9000 * 1000).toISOString() },
      { id: 'AUD-8994', actor: 'moderator.lee', role: 'moderator', action: 'PHOTO_REVIEW_APPROVED', target: 'MOD-1002', result: 'Photo accepted', createdAt: new Date(Date.now() - 12000 * 1000).toISOString() },
    ];

    const tx = db.transaction((items) => {
      items.forEach((item) => insertAudit.run(item));
    });

    tx(seedLogs);
  }
}

seedIfEmpty();

const aiScorePayloadSchema = {
  interests: ['music', 'travel', 'fitness'],
  goals: ['long_term', 'family'],
  lifestyle: ['active', 'social'],
  candidate: {
    interests: ['music', 'travel', 'books'],
    goals: ['long_term', 'career'],
    lifestyle: ['active', 'social'],
  },
};

const moderationQueue = [
  { id: 'MOD-1001', type: 'profile_report', priority: 'HIGH', status: 'REVIEWING', reason: 'Harassment report', createdAt: '2026-07-06T11:20:00.000Z' },
  { id: 'MOD-1002', type: 'photo_review', priority: 'NORMAL', status: 'PENDING', reason: 'Suspicious media content', createdAt: '2026-07-07T09:05:00.000Z' },
  { id: 'MOD-1003', type: 'identity_check', priority: 'HIGH', status: 'PENDING', reason: 'Verification mismatch', createdAt: '2026-07-08T07:40:00.000Z' },
];

const safetyCenter = {
  safetyScore: 92,
  modules: ['Identity Verification', 'Report User', 'Blocked Users', 'Privacy Controls', 'Emergency Contact'],
  alerts: [],
};

const featureGroups = [
  {
    title: 'Dashboard',
    items: [
      { name: 'Dashboard', status: 'active' },
      { name: 'Explore', status: 'active' },
      { name: 'Matches', status: 'active' },
    ],
  },
  {
    title: 'Connections',
    items: [
      { name: 'Likes Received', status: 'active' },
      { name: 'Likes Sent', status: 'active' },
      { name: 'Favorites', status: 'active' },
      { name: 'Profile Visitors', status: 'active' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { name: 'Messages', status: 'active' },
      { name: 'Voice Connect', status: 'active' },
      { name: 'Video Dating', status: 'active' },
      { name: 'Date Requests', status: 'active' },
    ],
  },
  {
    title: 'Discovery',
    items: [
      { name: 'Nearby Singles', status: 'active' },
      { name: 'Smart Match AI', status: 'active' },
      { name: 'Events & Meetups', status: 'active' },
    ],
  },
  {
    title: 'Profile',
    items: [
      { name: 'My Profile', status: 'active' },
      { name: 'Verification Center', status: 'active' },
      { name: 'Profile Analytics', status: 'active' },
      { name: 'Date Planner', status: 'active' },
    ],
  },
  {
    title: 'Premium + Safety',
    items: [
      { name: 'Premium', status: 'active' },
      { name: 'Safety Center', status: 'active' },
      { name: 'Rewards & Referrals', status: 'active' },
      { name: 'Settings', status: 'active' },
      { name: 'Help & Support', status: 'active' },
    ],
  },
];

function getPagination(req, defaultPageSize = 10, maxPageSize = 100) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number.parseInt(req.query.pageSize, 10) || defaultPageSize));
  return { page, pageSize };
}

function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

function normalizeRole(role) {
  return String(role || 'viewer').toLowerCase();
}

function mapClaimsToActor(payload) {
  const actorId = payload.sub || payload.userId || payload.id || payload.actorId || payload.email || 'token.actor';
  const actorRole = normalizeRole(payload.role || payload.roles?.[0] || payload.scopeRole || 'viewer');
  return {
    id: String(actorId),
    role: actorRole,
  };
}

const DEV_ALLOWED_ROLES = ['admin', 'support', 'moderator'];

function issueDevToken(role, actorId) {
  const normalizedRole = normalizeRole(role);
  if (!DEV_ALLOWED_ROLES.includes(normalizedRole)) {
    return null;
  }

  const subject = actorId || `dev.${normalizedRole}`;
  const payload = {
    sub: subject,
    role: normalizedRole,
    scope: 'dev-token',
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '8h',
  });

  return {
    token,
    actor: {
      id: subject,
      role: normalizedRole,
    },
    expiresIn: '8h',
  };
}

function getActor(req) {
  const headerActor = req.header('x-actor-id');
  const headerRole = req.header('x-role');
  if (headerActor || headerRole) {
    return {
      id: headerActor || 'anonymous.actor',
      role: normalizeRole(headerRole || 'viewer'),
    };
  }

  return {
    id: 'anonymous.actor',
    role: 'viewer',
  };
}

function authContext(req, _res, next) {
  const auth = req.header('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

  if (bearer) {
    try {
      const payload = jwt.verify(bearer, JWT_SECRET, { algorithms: ['HS256'] });
      req.actor = mapClaimsToActor(payload);
      req.jwtClaims = payload;
      req.headers['x-actor-id'] = req.actor.id;
      req.headers['x-role'] = req.actor.role;
    } catch (_error) {
      req.authError = 'Invalid or expired JWT token';
      req.actor = getActor(req);
    }
  } else {
    req.actor = getActor(req);
  }

  return next();
}

app.use(authContext);

function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (req.authError) {
      return res.status(401).json({ error: req.authError });
    }

    const actor = req.actor || getActor(req);
    if (!allowedRoles.includes(actor.role)) {
      return res.status(403).json({ error: `Role ${actor.role} is not allowed for this operation.` });
    }

    req.actor = actor;
    return next();
  };
}

const insertAuditStmt = db.prepare(`
  INSERT INTO audit_logs (id, actor, role, action, target, result, createdAt)
  VALUES (@id, @actor, @role, @action, @target, @result, @createdAt)
`);

function createAuditLog(entry) {
  const log = {
    id: `AUD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    actor: entry.actor,
    role: entry.role || null,
    action: entry.action,
    target: entry.target,
    result: entry.result,
  };

  insertAuditStmt.run(log);
  return log;
}

function overlap(a, b) {
  const source = new Set((a || []).map((value) => String(value).toLowerCase()));
  return (b || []).filter((value) => source.has(String(value).toLowerCase())).length;
}

function scoreMatch(input) {
  const interestScore = overlap(input.interests, input.candidate.interests) * 12;
  const goalScore = overlap(input.goals, input.candidate.goals) * 20;
  const lifestyleScore = overlap(input.lifestyle, input.candidate.lifestyle) * 10;
  const score = Math.min(100, 30 + interestScore + goalScore + lifestyleScore);
  return {
    score,
    label: score >= 85 ? 'Excellent Match' : score >= 70 ? 'Strong Match' : score >= 55 ? 'Possible Match' : 'Low Match',
    reasons: [
      'Shared relationship goals',
      'Compatible interests',
      'Lifestyle alignment',
      'Communication potential',
    ],
  };
}

function buildSqlFilters(filters) {
  const clauses = [];
  const params = {};

  if (filters.status) {
    clauses.push('status = @status');
    params.status = filters.status;
  }
  if (filters.priority) {
    clauses.push('priority = @priority');
    params.priority = filters.priority;
  }
  if (filters.search) {
    clauses.push('(id LIKE @search OR title LIKE @search OR IFNULL(details, \'\') LIKE @search)');
    params.search = `%${filters.search}%`;
  }

  return {
    where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

function fetchTickets(filters, page, pageSize) {
  const filterData = buildSqlFilters(filters);
  const countQuery = db.prepare(`SELECT COUNT(*) AS count FROM tickets ${filterData.where}`);
  const total = countQuery.get(filterData.params).count;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const dataQuery = db.prepare(`
    SELECT id, title, details, priority, status, createdAt, createdBy, updatedAt, updatedBy
    FROM tickets
    ${filterData.where}
    ORDER BY datetime(createdAt) DESC
    LIMIT @limit OFFSET @offset
  `);

  const rows = dataQuery.all({
    ...filterData.params,
    limit: pageSize,
    offset,
  });

  return {
    items: rows,
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

function fetchAuditLogs(filters, page, pageSize) {
  const clauses = [];
  const params = {};

  if (filters.actor) {
    clauses.push('LOWER(actor) LIKE @actor');
    params.actor = `%${filters.actor.toLowerCase()}%`;
  }
  if (filters.action) {
    clauses.push('LOWER(action) LIKE @action');
    params.action = `%${filters.action.toLowerCase()}%`;
  }
  if (filters.target) {
    clauses.push('LOWER(target) LIKE @target');
    params.target = `%${filters.target.toLowerCase()}%`;
  }
  if (filters.search) {
    clauses.push('(LOWER(actor) LIKE @search OR LOWER(action) LIKE @search OR LOWER(target) LIKE @search OR LOWER(result) LIKE @search)');
    params.search = `%${filters.search.toLowerCase()}%`;
  }
  if (filters.from) {
    clauses.push('datetime(createdAt) >= datetime(@from)');
    params.from = filters.from;
  }
  if (filters.to) {
    clauses.push('datetime(createdAt) <= datetime(@to)');
    params.to = filters.to;
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS count FROM audit_logs ${where}`).get(params).count;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const rows = db.prepare(`
    SELECT id, actor, role, action, target, result, createdAt
    FROM audit_logs
    ${where}
    ORDER BY datetime(createdAt) DESC
    LIMIT @limit OFFSET @offset
  `).all({
    ...params,
    limit: pageSize,
    offset,
  });

  return {
    items: rows,
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

const modules = featureGroups.flatMap((group) => group.items);

app.get('/api/modules', (_req, res) => res.json(modules.map((item, id) => ({ id: id + 1, name: item.name, status: item.status }))));
app.get('/api/feature-groups', (_req, res) => res.json(featureGroups));
app.get('/api/dashboard', (_req, res) => res.json({ users: 12840, matches: 4312, messages: 9820, safetyScore: 98, conversionRate: 12.4, rewardBalance: 48, activePlans: 384 }));
app.get('/api/matches', (_req, res) => res.json(Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `DateBuk User ${i + 1}`, matchScore: Math.floor(70 + Math.random() * 30), online: i % 3 === 0, city: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan'][i % 4], feature: 'Realtime connection' }))));
app.get('/api/featured-people', (_req, res) => res.json([
  { id: 1, name: 'Mausia', city: 'Lagos', score: 98, online: true },
  { id: 2, name: 'Puril', city: 'Abuja', score: 94, online: false },
  { id: 3, name: 'Aplick', city: 'Lekki', score: 96, online: true },
]));
app.post('/api/date-requests', (req, res) => res.status(201).json({ message: 'Date request created', data: req.body }));
app.post('/api/rewards/check-in', (_req, res) => res.json({ message: 'Daily check-in recorded', streak: 12, points: 25 }));

app.post('/api/auth/dev-token', (req, res) => {
  const role = normalizeRole(req.body?.role || '');
  const actorId = String(req.body?.actorId || '').trim();
  const issued = issueDevToken(role, actorId);

  if (!issued) {
    return res.status(400).json({
      error: 'Invalid role. Use one of: admin, support, moderator.',
    });
  }

  return res.status(201).json(issued);
});

app.get('/api/auth/me', (req, res) => {
  if (req.authError) {
    return res.status(401).json({ error: req.authError });
  }

  return res.json({ actor: req.actor || getActor(req) });
});

app.post('/api/match/score', (req, res) => {
  const payload = req.body && req.body.candidate ? req.body : aiScorePayloadSchema;
  return res.json(scoreMatch(payload));
});

app.get('/api/safety/center', (_req, res) => res.json(safetyCenter));
app.post('/api/safety/report', (req, res) => res.status(201).json({ id: `RPT-${Date.now()}`, status: 'PENDING', ...req.body }));

app.get('/api/admin/moderation', (req, res) => {
  const { page, pageSize } = getPagination(req, 8, 100);
  const statusFilter = String(req.query.status || '').toUpperCase();
  const priorityFilter = String(req.query.priority || '').toUpperCase();
  const typeFilter = String(req.query.type || '').toLowerCase();
  const searchFilter = String(req.query.search || '').toLowerCase();

  const filtered = moderationQueue.filter((item) => {
    if (statusFilter && String(item.status || '').toUpperCase() !== statusFilter) return false;
    if (priorityFilter && String(item.priority || '').toUpperCase() !== priorityFilter) return false;
    if (typeFilter && String(item.type || '').toLowerCase() !== typeFilter) return false;
    if (searchFilter) {
      const haystack = `${item.id} ${item.type} ${item.reason || ''}`.toLowerCase();
      if (!haystack.includes(searchFilter)) return false;
    }
    return true;
  });

  const paged = paginate(filtered, page, pageSize);
  const stats = {
    pending: moderationQueue.filter((item) => item.status === 'PENDING').length,
    actioned: moderationQueue.filter((item) => item.status === 'ACTIONED').length,
    dismissed: moderationQueue.filter((item) => item.status === 'DISMISSED').length,
  };

  return res.json({
    ...paged,
    stats,
    filters: {
      status: req.query.status || '',
      priority: req.query.priority || '',
      type: req.query.type || '',
      search: req.query.search || '',
    },
  });
});

app.get('/api/admin/audit-logs', (req, res) => {
  const { page, pageSize } = getPagination(req, 10, 100);
  const filters = {
    actor: String(req.query.actor || ''),
    action: String(req.query.action || ''),
    target: String(req.query.target || ''),
    search: String(req.query.search || ''),
    from: String(req.query.from || ''),
    to: String(req.query.to || ''),
  };

  const paged = fetchAuditLogs(filters, page, pageSize);
  return res.json({ ...paged, filters });
});

app.get('/api/tickets', (req, res) => {
  const { page, pageSize } = getPagination(req, 8, 100);
  const filters = {
    status: String(req.query.status || '').toUpperCase(),
    priority: String(req.query.priority || '').toUpperCase(),
    search: String(req.query.search || ''),
  };

  const paged = fetchTickets(filters, page, pageSize);
  return res.json({ ...paged, filters });
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = db.prepare('SELECT id, title, details, priority, status, createdAt, createdBy, updatedAt, updatedBy FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  return res.json(ticket);
});

app.post('/api/tickets', requireRoles(['admin', 'support']), (req, res) => {
  const actor = req.actor || getActor(req);
  const ticket = {
    id: `TCK-${Date.now()}`,
    status: 'OPEN',
    priority: String(req.body.priority || 'NORMAL').toUpperCase(),
    createdAt: new Date().toISOString(),
    createdBy: actor.id,
    updatedAt: null,
    updatedBy: null,
    title: req.body.title || 'Support request',
    details: req.body.details || 'No details provided',
  };

  db.prepare(`
    INSERT INTO tickets (id, title, details, priority, status, createdAt, createdBy, updatedAt, updatedBy)
    VALUES (@id, @title, @details, @priority, @status, @createdAt, @createdBy, @updatedAt, @updatedBy)
  `).run(ticket);

  createAuditLog({
    actor: actor.id,
    role: actor.role,
    action: 'TICKET_CREATED',
    target: ticket.id,
    result: `Ticket created with priority ${ticket.priority}`,
  });

  return res.status(201).json(ticket);
});

app.patch('/api/tickets/:id', requireRoles(['admin', 'support']), (req, res) => {
  const actor = req.actor || getActor(req);
  const existing = db.prepare('SELECT id, title, details, priority, status FROM tickets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ticket not found' });

  const next = {
    id: existing.id,
    title: req.body.title || existing.title,
    details: req.body.details || existing.details,
    priority: String(req.body.priority || existing.priority).toUpperCase(),
    status: String(req.body.status || existing.status).toUpperCase(),
    updatedAt: new Date().toISOString(),
    updatedBy: actor.id,
  };

  db.prepare(`
    UPDATE tickets
    SET title = @title, details = @details, priority = @priority, status = @status, updatedAt = @updatedAt, updatedBy = @updatedBy
    WHERE id = @id
  `).run(next);

  createAuditLog({
    actor: actor.id,
    role: actor.role,
    action: 'TICKET_STATUS_CHANGED',
    target: next.id,
    result: `Ticket updated to ${next.status}`,
  });

  const updated = db.prepare('SELECT id, title, details, priority, status, createdAt, createdBy, updatedAt, updatedBy FROM tickets WHERE id = ?').get(next.id);
  return res.json(updated);
});

app.patch('/api/admin/moderation/:id', requireRoles(['admin', 'moderator']), (req, res) => {
  const actor = req.actor || getActor(req);
  const queueItem = moderationQueue.find((item) => item.id === req.params.id);
  if (!queueItem) return res.status(404).json({ error: 'Moderation item not found' });

  if (req.body.status) {
    queueItem.status = String(req.body.status).toUpperCase();
  }
  if (req.body.reason) {
    queueItem.reason = req.body.reason;
  }
  queueItem.updatedAt = new Date().toISOString();
  queueItem.updatedBy = actor.id;

  createAuditLog({
    actor: actor.id,
    role: actor.role,
    action: 'MODERATION_DECISION_UPDATED',
    target: queueItem.id,
    result: `Moderation updated to ${queueItem.status}`,
  });

  return res.json(queueItem);
});

app.listen(5000, () => console.log('DateBuk API running on http://localhost:5000'));
