-- Add DELETE policy for users to delete their own reports
CREATE POLICY "Users can delete their own reports"
ON public.dental_reports
FOR DELETE
USING (auth.uid() = user_id);