# send-message-push

This function is intended for a Supabase Database Webhook on `public.messages` INSERT. It is not a browser endpoint. Configure the webhook to send the inserted row as `{ "record": { ... } }` and add the `x-bibu-webhook-secret` (or `x-bibo-webhook-secret`) header.

## Secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BIBU_WEBHOOK_SECRET` (or `BIBO_WEBHOOK_SECRET`): webhook-only secret, sent as `x-bibu-webhook-secret` (or `x-bibo-webhook-secret`).
- `GETUI_APP_ID`: 个推 App ID
- `GETUI_APP_KEY`: 个推 App Key
- `GETUI_MASTER_SECRET`: 个推 Master Secret

## Flow

1. Database webhook sends the inserted message row (`id`, `couple_id`, `sender_id`, `content`).
2. The function authenticates the webhook secret and finds the other member of the couple.
3. It reads that member's registered push tokens (CIDs). The function does **not** apply a hidden foreground time window or use `last_seen_at` to suppress delivery. Every valid registered token is a delivery target; Realtime updates the in-app view separately.
4. For target devices it sends an encrypted/transmission push via 个推 REST API v2: title = generic private title, body = generic prompt without message content, data = `{ route: "#chat?message=<id>", message_id, kind }`, channel `bibo_messages_v2`. Message content never appears in the data payload or visible system notification body.
5. Unregistered / invalid tokens are handled cleanly; delivery is best-effort.
6. Anonymous rows, missing partner, or no registered devices are skipped without claiming delivery.

## Privacy

- The notification title and body are generic; the message is only shown after opening the app.
- No couple IDs, user IDs, or message content is placed in the visible system notification.
