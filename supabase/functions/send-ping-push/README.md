# send-ping-push

This function is intended for a Supabase Database Webhook on `public.pings` INSERT. It is not a browser endpoint. Configure the webhook to send the inserted row as `{ "record": { ... } }` and add the `x-bibo-webhook-secret` header.

## Secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BIBU_WEBHOOK_SECRET` (or `BIBO_WEBHOOK_SECRET`): a random webhook-only secret, configured on the database webhook request header `x-bibu-webhook-secret` (or `x-bibo-webhook-secret`).
- `FCM_SERVICE_ACCOUNT_JSON`: Firebase service-account JSON containing `project_id`, `client_email`, and `private_key`.

Never put these values in `.env.local`, Vite variables, the Android project, or `google-services.json` beyond the normal client Firebase configuration.

## Flow

1. Database webhook sends the inserted Ping record.
2. The function authenticates the webhook secret and finds the other member of the same couple.
3. It reads only that member's Android device tokens, obtains a short-lived Google OAuth access token, and sends an FCM HTTP v1 notification.
4. Invalid/unregistered tokens are removed. Other failures return a non-2xx response so the webhook can retry; successful tokens may receive a duplicate on a retry, so this is best-effort delivery, not an exactly-once guarantee.
5. Anonymous Pings and spaces without a second member are skipped without reporting a fake delivery.

The client-side Ping RPC remains the source of truth. A successful Ping write does not wait for FCM and does not claim that the other user read the notification.
