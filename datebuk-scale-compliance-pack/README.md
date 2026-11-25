# DateBuk Scale + Compliance Pack

Next step after the Enterprise Integrated Pack: make DateBuk ready for launch, growth, trust, and operations.

## What this pack adds

- Production notification service: email, SMS, push, in-app
- Subscription + wallet/payment service stubs
- Trust & Safety moderation workflow
- Consent, privacy, data export, and account deletion APIs
- Analytics events pipeline
- Admin risk dashboard pages
- Mobile notification and consent screens
- Web compliance center pages
- Docker, Kubernetes, Terraform starter files
- CI/CD pipeline starter
- QA test templates

## Recommended order of implementation

1. Wire `.env` values.
2. Run the API locally.
3. Connect web and mobile pages to API endpoints.
4. Add real providers: Stripe, SendGrid, Twilio, Firebase Cloud Messaging.
5. Deploy PostgreSQL, Redis, object storage, and API containers.
6. Add penetration testing, privacy review, and app-store submission checks.

## Local API run

```bash
cd api
npm install
npm run dev
```

## API environment

Copy `.env.example` to `.env` and update the values.
