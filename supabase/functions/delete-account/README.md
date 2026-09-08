# delete-account

This function is the only place that may use `SUPABASE_SERVICE_ROLE_KEY`. Never put that key in Vite variables or the Android/Web client.

Apply migrations through `202609080009_account_deletion.sql` before deploying this function; for the complete app, apply all migrations through `202609080016_device_push_registration.sql` in filename order. The function verifies the caller JWT, invokes `prepare_account_deletion` through the caller-scoped client, and only then calls `auth.admin.deleteUser` on the server.

Deletion semantics:

- the account and profile are deleted after the admin operation is confirmed;
- the current membership is removed and a sole-member space is sealed;
- messages, events, photos, and pings authored by the deleted account remain for the other player with ownership anonymized;
- registered photo metadata and the account photo folder are removed by the server; local IndexedDB outbox and offline snapshots are cleared by the client after a confirmed response;
- if admin deletion fails after preparation, the response says so explicitly and is not reported as complete.
