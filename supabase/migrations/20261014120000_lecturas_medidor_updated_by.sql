-- Audit who last edited a meter reading. submitted_by keeps who REGISTERED it;
-- updated_by is stamped by the app on every later edit (re-submission, admin
-- correction, tarifa re-propagation). updated_at already exists and is set by
-- trg_lecturas_medidor_updated_at on every UPDATE. NULL = never edited from
-- the app (edits made directly in the DB only move updated_at).
-- Idempotent: safe to re-run.

ALTER TABLE v2.lecturas_medidor
    ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES v2.perfiles(id);

COMMENT ON COLUMN v2.lecturas_medidor.updated_by IS 'Perfil that last edited the reading from the app (NULL = never edited). submitted_by is who registered it; updated_at is when it last changed.';
