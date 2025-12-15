# Plaid Integration Guide

## Current Status: Sandbox

The app is configured for Plaid Sandbox environment. Both endpoints work:
- `POST /api/plaid/create-link-token` - Creates link token for Plaid Link
- `POST /api/plaid/exchange-token` - Exchanges public token for access token

## Production Setup

### 1. Get Production Credentials

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/)
2. Navigate to **Team Settings** > **Keys**
3. Copy your **Production** client ID and secret

### 2. Update Environment Variables

```bash
# .env
PLAID_CLIENT_ID=your-production-client-id
PLAID_SECRET=your-production-secret
PLAID_ENV=production
```

### 3. Configure OAuth Redirect URIs

For OAuth banks (Chase, Capital One, etc.), you must register redirect URIs:

1. Go to Plaid Dashboard > **Team Settings** > **Redirect URIs**
2. Add your URIs:
   - iOS: `ceezaa://plaid-oauth`
   - Android: `ceezaa://plaid-oauth`
   - Web (if applicable): `https://your-domain.com/plaid-oauth`

3. Uncomment the redirect_uri code in [plaid_client.py](app/services/plaid_client.py#L74-L77):
   ```python
   if settings.plaid_env == "sandbox":
       request_kwargs["redirect_uri"] = "https://cdn.plaid.com/link/v2/stable/sandbox-oauth-a2a-redirect.html"
   else:
       request_kwargs["redirect_uri"] = "ceezaa://plaid-oauth"
   ```

### 4. Mobile App Configuration

Ensure `app.json` has the URL scheme configured (already done):
```json
{
  "expo": {
    "scheme": "ceezaa"
  }
}
```

## Testing Checklist

### Sandbox Testing
- [x] Create link token endpoint works
- [x] Exchange token endpoint works
- [x] Plaid Link opens in mobile app
- [x] Can select test bank (First Platypus Bank)
- [ ] Can complete full linking flow

**Test Credentials:**
- Username: `user_good`
- Password: `pass_good`
- Or phone: `415-555-0011` (OTP: `1234`)

### Production Testing
- [ ] Production credentials configured
- [ ] Redirect URIs registered in Plaid Dashboard
- [ ] Can link real bank account
- [ ] OAuth banks (Chase, etc.) redirect correctly

## Remaining Work

1. **linked_accounts table** - Store access tokens and item IDs
2. **Transaction sync** - Fetch and store transactions using `transactions/sync`
3. **Webhook setup** - For real-time transaction updates (optional for MVP)
