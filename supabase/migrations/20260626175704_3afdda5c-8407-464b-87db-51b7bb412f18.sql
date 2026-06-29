
ALTER TABLE public.treatment_notes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS treatment_notes_patient_doctor_unique
  ON public.treatment_notes(patient_id, doctor_id);

CREATE INDEX IF NOT EXISTS treatment_notes_patient_id_idx
  ON public.treatment_notes(patient_id);

DROP TRIGGER IF EXISTS update_treatment_notes_updated_at ON public.treatment_notes;
CREATE TRIGGER update_treatment_notes_updated_at
  BEFORE UPDATE ON public.treatment_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.treatment_notes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.treatment_notes;
