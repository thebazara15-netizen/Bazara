# Social Login Setup

The app already has routes for Google, Facebook, and LinkedIn social login.

## Local Callback URLs

Add these exact redirect URLs in each provider dashboard:

```text
Google:   http://localhost:5000/api/auth/google/callback
Facebook: http://localhost:5000/api/auth/facebook/callback
LinkedIn: http://localhost:5000/api/auth/linkedin/callback
```

## Backend Environment Variables

Paste the provider credentials into `backend/.env`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

Then restart the backend server.

## Provider Notes

Google needs an OAuth 2.0 Web Application client with the Google callback URL above.

Facebook needs Facebook Login enabled and the Facebook callback URL in Valid OAuth Redirect URIs.

LinkedIn needs Sign In with LinkedIn using OpenID Connect and the LinkedIn callback URL above.
