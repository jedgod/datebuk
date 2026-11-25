# DateBuk Pages & Support System Documentation

## Frontend Pages Created

### 1. **About Page** (`/about`)

- **Route:** `/about`
- **Purpose:** Company information and mission statement
- **Content:**
  - About DateBuk overview
  - Company mission
  - Why choose DateBuk (5 key features)
  - Core values (Authenticity, Safety, Inclusivity, Innovation)
  - Call-to-action buttons (Start Free, Get in Touch)

### 2. **Privacy Policy** (`/privacy`)

- **Route:** `/privacy`
- **Purpose:** Privacy and data protection information
- **Content:**
  - Privacy commitment
  - Data security measures
  - What information is collected
  - How information is used
  - User privacy rights
  - Third-party sharing policies
  - Cookies & tracking information
  - Contact for privacy concerns

### 3. **Terms & Conditions** (`/terms`)

- **Route:** `/terms`
- **Purpose:** Legal terms and platform rules
- **Content:**
  - User eligibility requirements
  - Account security responsibilities
  - Prohibited behavior list
  - Moderation and reporting procedures
  - Intellectual property information
  - Limitation of liability
  - Subscription terms
  - Account termination policy
  - Safety reminders

### 4. **Contact Page** (`/contact`)

- **Route:** `/contact`
- **Purpose:** Support ticket submission and contact information
- **Features:**
  - Contact form with email validation
  - Issue type selector (General, Account, Payment, Safety, Technical, Feedback, Report)
  - Real-time form submission with loading state
  - Success/error messages
  - Links to FAQ and community guidelines
  - Direct contact information (Email, Live Chat, Response Times)

## Backend Support System

### API Endpoints

#### Create Support Ticket

```
POST /support/tickets
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "issueType": "account",
  "message": "I cannot log in to my account"
}

Response:
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "issueType": "account",
  "message": "I cannot log in to my account",
  "status": "open",
  "createdAt": "2026-02-12T00:00:00Z"
}
```

#### Get All Tickets (Admin Only)

```
GET /support/tickets
Authorization: Bearer {jwt_token}
(Requires admin role)

Response: Array of tickets with status, timestamps, etc.
```

#### Get Single Ticket

```
GET /support/tickets/:id
```

#### Update Ticket Status (Admin Only)

```
PATCH /support/tickets/:id/status
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "status": "resolved" | "in_progress" | "closed"
}
```

### Database Model

```prisma
model SupportTicket {
  id        String   @id @default(uuid())
  name      String
  email     String
  issueType String
  message   String
  status    String   @default("open")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

## Email Configuration

The support system sends automated emails using Gmail's SMTP service. Configure in `apps/api/.env`:

```env
# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
SUPPORT_EMAIL=support@datebuk.com
ADMIN_DASHBOARD_URL=http://localhost:4000/admin
```

### Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Copy the 16-character app password
3. **Paste the app password** into `EMAIL_PASS` environment variable

### Automated Emails Sent

1. **User Confirmation Email**
   - Sent when ticket is created
   - Includes ticket ID and summary
   - Confirms receipt of support request

2. **Support Team Notification**
   - Sent to SUPPORT_EMAIL when new ticket arrives
   - Includes all ticket details
   - Link to admin dashboard

3. **Status Update Email**
   - Sent when ticket status changes
   - Notifies user of progress
   - Provides status-specific messages

## Setup Instructions

### 1. Run Database Migration

```bash
# Create migration for SupportTicket model
pnpm --filter api prisma migrate dev --name add_support_tickets

# This creates and applies the migration automatically
```

### 2. Install Dependencies

```bash
# Install new packages
pnpm install

# Or just update the API packages
pnpm --filter api install
```

### 3. Configure Environment Variables

```bash
# Edit apps/api/.env
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
```

### 4. Start the Application

```bash
# Terminal 1: Start API
pnpm --filter api dev

# Terminal 2: Start Web App
pnpm --filter web dev

# Access pages at:
# - About: http://localhost:3000/about
# - Privacy: http://localhost:3000/privacy
# - Terms: http://localhost:3000/terms
# - Contact: http://localhost:3000/contact
```

## Frontend Integration

The pages are integrated into the home page footer:

```tsx
<footer>
  <a href="/about">About</a>
  <a href="/privacy">Privacy</a>
  <a href="/terms">Terms</a>
  <a href="/contact">Contact</a>
</footer>
```

All pages are styled with:

- Consistent branding (DateBuk logo, gradient colors)
- Responsive design (mobile-first)
- Back to home button in header
- Professional typography and spacing

## Support Ticket Workflow

1. **User submits form** on `/contact` page
2. **Backend validates** and saves to database
3. **Confirmation email** sent to user
4. **Support team notified** automatically
5. **Admin reviews** in dashboard
6. **Status updated** (in_progress, resolved, closed)
7. **User receives** status update email

## Admin Dashboard Functions

Admins can:

- View all incoming support tickets
- Filter by status (open, in_progress, resolved, closed)
- Sort by date and issue type
- Mark tickets as resolved
- Receive automatic notifications
- Track response times

## Testing the Contact Form

```bash
curl -X POST http://localhost:4000/support/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "issueType": "feedback",
    "message": "Love the app!"
  }'
```

## Troubleshooting

### Emails not sending

1. Check EMAIL_USER and EMAIL_PASS are correct
2. Verify 2FA is enabled and app password is set
3. Check email logs: `docker logs [container-id]`

### Tickets not saving

1. Run migrations: `pnpm --filter api prisma migrate deploy`
2. Check database connection in DATABASE_URL
3. Verify Prisma schema has SupportTicket model

### Form validation errors

1. All fields required: name, email, issueType, message
2. Email must be valid format
3. Message must not be empty
4. Issue type must match select options

## Future Enhancements

- [ ] Ticket attachments (file uploads)
- [ ] Rating/feedback on resolved tickets
- [ ] Email templates customization
- [ ] SMS notifications option
- [ ] Ticket categories with auto-routing
- [ ] Canned responses for common issues
- [ ] Ticket search and filter UI
- [ ] SLA tracking (response time targets)

## Files Created

```
apps/web/src/app/
├── about/
│   └── page.tsx
├── privacy/
│   └── page.tsx
├── terms/
│   └── page.tsx
└── contact/
    └── page.tsx

apps/api/src/support/
├── support.controller.ts
├── support.service.ts
└── support.module.ts
```

## Related Configuration

- **Updated Files:**
  - `apps/api/src/app.module.ts` - Added SupportModule
  - `apps/api/package.json` - Added nodemailer dependency
  - `apps/api/prisma/schema.prisma` - Added SupportTicket model
  - `apps/api/.env` - Added email configuration

## Support

For issues or questions:

- Check PAYMENT_INTEGRATION.md for payment-related features
- Email: support@datebuk.com
- GitHub Issues: Report bugs and feature requests
