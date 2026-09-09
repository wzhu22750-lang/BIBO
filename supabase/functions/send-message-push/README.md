# send-message-push

This function is intended for a Supabase Database Webhook on `public.messages` INSERT. It is not a browser endpoint. Configure the webhook to send the inserted row as `{ "record": { ... } }` and add the `x-bibo-webhook-secret` header (the same secret used by `send-ping-push`).

## Secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BIBU_WEBHOOK_SECRET` (or `BIBO_WEBHOOK_SECRET`): webhook-only secret, sent as `x-bibu-webhook-secret` (or `x-bibo-webhook-secret`).
- `FCM_SERVICE_ACCOUNT_JSON`: Firebase service-account JSON containing `project_id`, `client_email`, and `private_key`.

## Flow

1. Database webhook sends the inserted message row (`id`, `couple_id`, `sender_id`, `content`).
2. The function authenticates the webhook secret and finds the other member of the couple.
3. It reads that member's Android device rows. The function does **not** apply a hidden foreground time window or use `last_seen_at` to suppress delivery. Every valid registered Android token is a delivery target; Realtime updates the in-app view separately.
4. For remaining devices it sends an FCM HTTP v1 **notification** message: title = generic private title, body = generic prompt without message content, data = `{ route: "#chat?message=<id>", message_id, kind }`, channel `bibo_messages_v2`. Message content never appears in the data payload or visible system notification body.
5. Unregistered tokens are deleted; other FCM failures return non-2xx so the webhook can retry. Retries may duplicate a notification on already-successful tokens; Android notification-id stability is not guaranteed across sends, so this is best-effort delivery, not exactly-once.
6. Anonymous rows, missing partner, or no registered devices are skipped without claiming delivery.

## Privacy

- The notification title and body are generic; the message is only shown after opening the app. The FCM payload and native Builder request PRIVATE visibility, while the final lock-screen rendering remains controlled by Android system settings.
- No couple IDs, user IDs, or message content is placed in the visible system notification.

## Not verified until webhook and device validation

Token registration ≠ delivery. This function is deployed in the current project, but must still be wired to a database webhook and validated against a real Firebase project + physical device before claiming FCM message delivery works.
