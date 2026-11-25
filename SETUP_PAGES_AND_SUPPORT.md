# Quick Setup Guide - DateBuk Pages & Support System

## What Was Added

✅ **4 New Frontend Pages** (fully styled and responsive)

- `/about` - Company information and mission
- `/privacy` - Privacy policy and data protection
- `/terms` - Terms and conditions
- `/contact` - Support ticket submission form

✅ **Backend Support Ticketing System**

- NestJS REST API for ticket management
- Automated email notifications
- Admin dashboard integration
- Database persistence with Prisma

✅ **Email Notifications**

- User confirmation emails
- Support team notifications
- Status update emails

## Files Created/Modified

### Frontend (Next.js)

```
apps/web/src/app/
├── about/page.tsx          (NEW)
├── privacy/page.tsx        (NEW)
├── terms/page.tsx          (NEW)
└── contact/page.tsx        (NEW)
```

### Backend (NestJS)

```
apps/api/src/support/
├── support.controller.ts   (NEW)
├── support.service.ts      (NEW)
└── support.module.ts       (NEW)
```

### Configuration Files Modified

- `apps/api/src/app.module.ts` - Added SupportModule
- `apps/api/package.json` - Added nodemailer & @types/nodemailer
- `apps/api/prisma/schema.prisma` - Added SupportTicket model
- `apps/api/.env` - Added email configuration

## Installation Steps

### Step 1: Install Dependencies

```bash
pnpm install
# or just the API packages:
pnpm --filter api install
```

### Step 2: Configure Email (Gmail Recommended)

Edit `apps/api/.env`:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
SUPPORT_EMAIL=support@datebuk.com
ADMIN_DASHBOARD_URL=http://localhost:4000/admin
```

**To get Gmail app password:**

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" + your device type
3. Copy the 16-character password
4. Paste into `EMAIL_PASS` field

### Step 3: Run Database Migration

```bash
# Create and apply the migration
pnpm --filter api prisma migrate dev --name add_support_tickets
```

### Step 4: Start the Application

```bash
# Terminal 1: API Server
pnpm --filter api dev

# Terminal 2: Web App
pnpm --filter web dev
```

## Test the Pages

Visit in your browser:

- **About:** http://localhost:3000/about
- **Privacy:** http://localhost:3000/privacy
- **Terms:** http://localhost:3000/terms
- **Contact:** http://localhost:3000/contact

## Test the Support API

**Create a support ticket:**

```bash
curl -X POST http://localhost:4000/support/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "issueType": "feedback",
    "message": "Great app!"
  }'
```

Expected response:

```json
{
  "id": "some-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "issueType": "feedback",
  "message": "Great app!",
  "status": "open",
  "createdAt": "2026-02-12T12:00:00Z"
}
```

## Available Issue Types

When submitting a support ticket, choose from:

- `general` - General inquiry
- `account` - Account issues
- `payment` - Payment/billing
- `safety` - Safety concerns
- `technical` - Technical problems
- `feedback` - Feature feedback
- `report` - Report user/content

## Email Workflow

1. **User submits form** on contact page
   ↓
2. **Confirmation email** sent to user
   ↓
3. **Notification email** sent to support team
   ↓
4. **Support team reviews** in admin dashboard
   ↓
5. **Status updated** (in_progress → resolved → closed)
   ↓
6. **Status update email** sent to user

## Admin Functions

Admins can (with JWT token):

- View all tickets: `GET /support/tickets`
- View single ticket: `GET /support/tickets/:id`
- Update status: `PATCH /support/tickets/:id/status`

## Troubleshooting

### Emails not sending?

- ✓ Check EMAIL_USER and EMAIL_PASS in .env
- ✓ Ensure Gmail 2FA is enabled
- ✓ Verify app password is set correctly
- ✓ Check API server logs for errors

### Tickets not saving?

- ✓ Run migration: `pnpm --filter api prisma migrate deploy`
- ✓ Check DATABASE_URL is correct
- ✓ Verify PostgreSQL is running

### Form validation errors?

- ✓ All fields are required
- ✓ Email must be valid format
- ✓ Message field cannot be empty

## Next Steps

1. Complete email setup with your Gmail account
2. Test contact form submission
3. Verify emails are being sent
4. Set up admin dashboard for ticket management
5. Customize privacy/terms if needed
6. Deploy to production with proper email credentials

## Documentation

- See `PAGES_AND_SUPPORT.md` for detailed API documentation
- See `PAYMENT_INTEGRATION.md` for payment system setup
- Check app logs for any errors: `tail -f logs/*.log`

## Commands Cheat Sheet

```bash
# Install dependencies
pnpm install

# Run migrations
pnpm --filter api prisma migrate dev --name add_support_tickets

# Start services
pnpm --filter api dev
pnpm --filter web dev

# View database
pnpm --filter api prisma studio

# Generate Prisma client
pnpm --filter api prisma generate

# Test API
curl -X POST http://localhost:4000/support/tickets \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","issueType":"feedback","message":"test"}'
```

## Support

Questions? Check the documentation:

- `PAGES_AND_SUPPORT.md` - Complete API & setup guide
- `PAYMENT_INTEGRATION.md` - Payment system guide
- Code comments in source files

Ready to go! 🚀
