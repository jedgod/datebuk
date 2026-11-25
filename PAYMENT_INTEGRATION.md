# RevenueCat Payment Integration Guide

## ✅ Status: COMPLETE & ACTIVE

The DateBuk application now has **full RevenueCat payment integration**.

**Test API Key:** `test_SKMBOnYOxYPLzkuPeUetBKfcXkl`  
**Entitlement ID:** `DateBuk Pro`

## Components

### Frontend (Next.js)

- **PricingSection.tsx** - Main pricing page component with plan selection
- **PaywallModal.tsx** - Modal for initiating purchases
- **FeatureGateWeb.tsx** - Component to gate features behind subscription tiers
- **useRevenueCatEntitlements.ts** - Hook to check user's subscription status

### Backend (NestJS)

- **SubscriptionsModule** - Handles subscription endpoints
- **SubscriptionsController** - REST endpoints for entitlements
- **SubscriptionsService** - Business logic for subscription management

## Setup Instructions

### 1. RevenueCat Configuration

#### Get/Create RevenueCat Account

1. Go to https://www.revenuecat.com/
2. Sign up or log in
3. Create an app for DateBuk

#### Configure Offerings & Products

1. In RevenueCat dashboard, create products:
   - `premium_monthly` - Monthly premium subscription
   - `elite_monthly` - Monthly elite subscription
2. Create entitlements:
   - `premium` - Standard subscription
   - `elite` - Premium subscription

3. Create offerings:
   - Default offering containing the products above

### 2. Environment Variables

#### Backend (.env) - ✅ CONFIGURED

```env
# RevenueCat
REVENUECAT_API_KEY=test_SKMBOnYOxYPLzkuPeUetBKfcXkl
REVENUECAT_ENTITLEMENT_ID=DateBuk Pro
```

Already set in `apps/api/.env`

### 3. Implement RevenueCat API Integration

✅ **COMPLETE** - The SubscriptionsService now includes full RevenueCat API integration.

The API service automatically:

- Fetches user entitlements from RevenueCat
- Handles 404 responses for new users
- Supports premium, elite, and datebuk-pro tiers
- Includes verification and webhook handling

### 4. Web Payment Integration

For web browsers, you have two options:

**Option A: RevenueCat (Recommended for cross-platform)**

- Uses RevenueCat's web SDK
- Supports iOS, Android, and web
- Manages subscriptions across all platforms

**Option B: Stripe (Recommended for web-only)**

- Integrates with Stripe Billing
- Better for European compliance (GDPR)
- More payment methods

We recommend **Stripe for web+RevenueCat for mobile**.

### 5. Configure Webhooks

Set up RevenueCat webhook in production dashboard:

**Endpoint:** `https://yourdomain.com/api/subscriptions/webhook/revenuecat`

**Events:**

- INITIAL_PURCHASE
- RENEWAL
- CANCELLATION
- EXPIRATION
- PRODUCT_CHANGE

## Testing

### Test Entitlements API

1. Start the API: `pnpm --filter api dev`
2. Get a JWT token by logging in or signing up
3. Test endpoint with your JWT:
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:4000/subscriptions/entitlements
   ```
4. Should return entitlements object

### Test Pricing Page

1. Start the web app: `pnpm --filter web dev`
2. Navigate to http://localhost:3000
3. Scroll to pricing section (or click "Pricing" in nav)
4. Click upgrade buttons to test paywall modal
5. Modal should display with RevenueCat branding

## Subscription Tiers

### Free (included)

- Create profile
- Browse matches
- Limited likes (10/day)

### Premium ($9.99/month)

- All free features
- Unlimited likes
- See who liked you
- Advanced filters
- No ads

### Elite ($19.99/month)

- All premium features
- Priority visibility
- 5 boosts/month
- Elite badge

## FEatures to Gate

Examples of features to gate behind Premium/Elite:

- Advanced search filters
- Boost visibility button
- See who liked you feature
- Message first without match
- Reading receipts

To implement:

```tsx
<FeatureGate feature="premium">
  <AdvancedFilters />
</FeatureGate>
```

## Next Steps for Production

1. ✅ Set up RevenueCat account (use test key for now)
2. ✅ Configure API key in backend .env
3. ✅ Implement API integration in SubscriptionsService
4. **TODO:** Choose web payment provider (Stripe recommended for web)
5. **TODO:** Test sandbox purchases in development
6. **TODO:** Set up production RevenueCat API key in .env.production
7. **TODO:** Configure webhooks for subscription events
8. **TODO:** Deploy to production
