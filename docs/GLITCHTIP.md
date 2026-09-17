# GlitchTip Setup Guide

This guide shows you how to connect your XMRig Dashboard to GlitchTip for error tracking and security monitoring.

## Quick Setup (2 minutes)

### 1. Get your GlitchTip credentials

Log in to your GlitchTip instance and navigate to your project settings. You'll find two important values:

- **DSN** (Data Source Name) - For error tracking
- **SEC** (Security Endpoint) - For CSP violation reporting

Example values:
```
DSN: https://abc123@glitchtip.example.com/1
SEC: https://glitchtip.example.com/api/1/security/?glitchtip_key=xyz789
```

### 2. Add to your `.env` file

```bash
# Required for error tracking
SENTRY_DSN=https://abc123@glitchtip.example.com/1

# Optional for CSP reporting
SENTRY_SEC=https://glitchtip.example.com/api/1/security/?glitchtip_key=xyz789
```

That's it! Restart your app and errors will automatically be sent to GlitchTip.

## What You Get

### Error Tracking (SENTRY_DSN)
- JavaScript errors in the browser
- Server-side errors in Next.js API routes
- Unhandled promise rejections
- Performance monitoring (1% sample rate to save space)

### Security Monitoring (SENTRY_SEC)
- Content Security Policy violations
- Browser security issues
- Automatic CSP header generation

## Optional: Source Map Upload

For readable stack traces in production, you can upload source maps:

```bash
# Add these to .env
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
```

Then during build:
```bash
pnpm build
```

Source maps are automatically uploaded if the credentials are provided.

## Testing

To verify everything is working:

1. **Test error tracking**: Open browser console and run:
   ```javascript
   throw new Error("Test error from XMRig Dashboard")
   ```

2. **Check GlitchTip**: You should see the error appear in your GlitchTip dashboard within a few seconds.

## Configuration Details

### Trace Sample Rate

The app uses `tracesSampleRate: 0.01` (1%) to minimize storage usage. You can adjust this in:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

### Replay Recording

Session replays are enabled with:
- 10% of all sessions recorded
- 100% of sessions with errors recorded

This helps debug issues but uses more storage. Disable by setting both to `0`.

### CSP Headers

When `SENTRY_SEC` is set, the app automatically adds these headers:
- `Content-Security-Policy` with `report-uri` pointing to your security endpoint
- `Report-To` for modern browser reporting

## Troubleshooting

### Errors not showing up?

1. Check that `SENTRY_DSN` is set correctly in `.env`
2. Verify your GlitchTip project is active
3. Check browser console for CORS errors
4. Look at Network tab - requests should go to your GlitchTip domain

### CSP violations not reporting?

1. Ensure `SENTRY_SEC` is set
2. Restart the app after adding the variable
3. Check that the security endpoint URL is correct

### Source maps not uploading?

1. Verify `SENTRY_AUTH_TOKEN` has project admin permissions
2. Check that `SENTRY_ORG` and `SENTRY_PROJECT` match your GlitchTip setup
3. Run `pnpm build` and look for upload messages in the output

## Advanced Configuration

For more advanced options, edit the Sentry config files directly:
- `sentry.client.config.ts` - Browser settings
- `sentry.server.config.ts` - Node.js server settings
- `sentry.edge.config.ts` - Edge runtime settings

See the [Sentry documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/) for all available options.

## Privacy Notes

- Error reports include stack traces and error messages
- Session replays capture user interactions (can be disabled)
- No sensitive data (passwords, API keys) is automatically captured
- You can use `beforeSend` to filter sensitive data if needed

## Support

For GlitchTip-specific issues, check your GlitchTip instance documentation or contact your administrator.
