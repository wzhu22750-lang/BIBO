# send-ping-push

This function is intended for a Supabase Database Webhook on `public.pings` INSERT. It is not a browser endpoint. Configure the webhook to send the inserted row as `{ "record": { ... } }` and add the `x-bibu-webhook-secret` (or `x-bibo-webhook-secret`) header.

## Secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BIBU_WEBHOOK_SECRET` (or `BIBO_WEBHOOK_SECRET`): webhook-only secret, sent as `x-bibu-webhook-secret` (or `x-bibo-webhook-secret`).
- `GETUI_APP_ID`: 个推 App ID
- `GETUI_APP_KEY`: 个推 App Key
- `GETUI_MASTER_SECRET`: 个推 Master Secret

## Flow

1. Database webhook sends the inserted Ping record.
2. The function authenticates the webhook secret and finds the other member of the same couple.
3. It reads only that member's registered push tokens (CIDs), authenticates with 个推 REST API v2, and sends the push notification.
4. Invalid tokens are handled cleanly; delivery is best-effort.
5. Anonymous Pings and spaces without a second member are skipped without reporting a fake delivery.

The client-side Ping RPC remains the source of truth. A successful Ping write does not block on push delivery and does not claim that the other user read the notification.
