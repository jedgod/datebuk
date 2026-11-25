-- Existing v1 installations only. Refuse to silently downgrade paid Plus accounts.
BEGIN;
LOCK TABLE dsacs.accounts IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM dsacs.accounts WHERE plan='plus') THEN RAISE EXCEPTION 'Resolve legacy Plus accounts with billing provider before migration'; END IF; END $$;
ALTER TABLE dsacs.accounts DROP CONSTRAINT accounts_plan_check;
ALTER TABLE dsacs.accounts ADD CONSTRAINT accounts_plan_check CHECK(plan IN ('free','premium','elite'));
COMMIT;
