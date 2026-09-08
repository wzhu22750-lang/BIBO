# send-message-push

This function is intended for a Supabase Database Webhook on `public.messages` INSERT. It is not a browser endpoint. Configure the webhook to send the inserted row as `{ "record": { ... } }` and add the `x-bibo-webhook-secret` header (the same secret used by `send-ping-push`).

## Secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BIBO_WEBHOOK_SECRET`: webhook-only secret, sent as `x-bibo-webhook-secret`.
- `FCM_SERVICE_ACCOUNT_JSON`: Firebase service-account JSON containing `project_id`, `client_email`, and `private_key`.

## Flow

1. Database webhook sends the inserted message row (`id`, `couple_id`, `sender_id`, `content`).
2. The function authenticates the webhook secret and finds the other member of the couple.
3. It reads that member's Android device rows. Devices whose `last_seen_at` is within the active window (client foreground heartbeat, see migration `202609080017`) are **skipped** — those users are inside the app and receive the message through Supabase Realtime. This is the server-side half of Realtime/FCM responsibility split and duplicate-notification prevention.
4. For remaining devices it sends an FCM HTTP v1 **notification** message: title = sender display name, body = whitespace-collapsed preview (≤ 80 code points), data = `{ route: "#chat?message=<id>", message_id, kind }`, channel `bibo_messages_v1`. Message content never appears in the data payload.
5. Unregistered tokens are deleted; other FCM failures return non-2xx so the webhook can retry. Retries may duplicate a notification on already-successful tokens; Android notification-id stability is not guaranteed across sends, so this is best-effort delivery, not exactly-once.
6. Anonymous rows, missing partner, or no registered devices are skipped without claiming delivery.

## Privacy

- The notification body shows a message preview on the lock screen per the user's Android notification-privacy settings for channel `bibo_messages_v1`; the channel is created with default visibility so the system/user preference decides.
- No couple IDs, user IDs, or message content beyond the truncated preview leave the server.

## Not verified until deployed

Token registration ≠ delivery. This function must be deployed with real secrets, wired to a database webhook, and validated against a real Firebase project + physical device before claiming FCM message delivery works.
