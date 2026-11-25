CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS dcg_provider_accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
 name text NOT NULL, account_sid text NOT NULL CHECK(account_sid ~ '^AC[0-9a-fA-F]{32}$'),
 encrypted_auth_token text, encrypted_api_key_secret text, api_key_sid text,
 enabled boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id, account_sid));
CREATE TABLE IF NOT EXISTS dcg_senders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
 provider_account_id uuid NOT NULL REFERENCES dcg_provider_accounts(id),
 sender_number text CHECK(sender_number IS NULL OR sender_number ~ '^\+[1-9][0-9]{1,14}$'),
 messaging_service_sid text CHECK(messaging_service_sid IS NULL OR messaging_service_sid ~ '^MG[0-9a-fA-F]{32}$'),
 enabled boolean NOT NULL DEFAULT false,
 CHECK ((sender_number IS NOT NULL) <> (messaging_service_sid IS NOT NULL)));
CREATE TABLE IF NOT EXISTS dcg_consents (
 tenant_id uuid NOT NULL, phone text NOT NULL, purpose text NOT NULL,
 status text NOT NULL CHECK(status IN ('opted_in','opted_out')),
 source text NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,phone,purpose));
CREATE TABLE IF NOT EXISTS dcg_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
 sender_id uuid NOT NULL REFERENCES dcg_senders(id), recipient text NOT NULL,
 purpose text NOT NULL, body text NOT NULL,
 idempotency_key text NOT NULL, provider_sid text,
 state text NOT NULL DEFAULT 'queued', error_code text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,idempotency_key));
CREATE UNIQUE INDEX IF NOT EXISTS dcg_provider_sid_idx ON dcg_messages(provider_sid) WHERE provider_sid IS NOT NULL;
CREATE TABLE IF NOT EXISTS dcg_webhook_events (
 provider_sid text NOT NULL, event_key text NOT NULL, payload jsonb NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(provider_sid,event_key));
CREATE TABLE IF NOT EXISTS dcg_audit (
 id bigserial PRIMARY KEY, tenant_id uuid, actor_id uuid, action text NOT NULL,
 subject_id text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 occurred_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS dcg_messages_tenant_created ON dcg_messages(tenant_id,created_at DESC);
