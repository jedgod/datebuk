ALTER TABLE dcg_messages ADD COLUMN IF NOT EXISTS actor_id uuid;
ALTER TABLE dcg_messages ADD COLUMN IF NOT EXISTS request_hash text;
ALTER TABLE dcg_messages ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
CREATE TABLE IF NOT EXISTS dcg_usage(tenant_id uuid NOT NULL, subject_id uuid NOT NULL, period text NOT NULL, used integer NOT NULL CHECK(used>=0), PRIMARY KEY(tenant_id,subject_id,period));
CREATE TABLE IF NOT EXISTS dcg_suppressions(tenant_id uuid NOT NULL, phone text NOT NULL, PRIMARY KEY(tenant_id,phone));
CREATE UNIQUE INDEX IF NOT EXISTS dcg_account_global ON dcg_provider_accounts(account_sid);
