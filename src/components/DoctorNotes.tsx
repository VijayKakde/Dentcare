import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, ClipboardList, ListChecks, Calendar, Lock, Inbox } from 'lucide-react';
import { supabase } from '@/integrations/supabase/browserClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TreatmentNote {
  id: string;
  note: string | null;
  treatment_plan: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  patientId: string;
}

export default function DoctorNotes({ patientId }: Props) {
  const [note, setNote] = useState<TreatmentNote | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLatest = async () => {
    const { data } = await supabase
      .from('treatment_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setNote((data as TreatmentNote | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (!patientId) return;
    fetchLatest();

    const channel = supabase
      .channel(`treatment_notes_${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treatment_notes',
          filter: `patient_id=eq.${patientId}`,
        },
        () => fetchLatest()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const followupBadge = () => {
    if (!note?.follow_up_date) return null;
    const d = new Date(note.follow_up_date);
    const now = new Date();
    const diffDays = Math.floor((d.getTime() - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20" variant="outline">Follow-up Overdue</Badge>;
    }
    if (diffDays <= 7) {
      return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20" variant="outline">Upcoming Soon</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">Scheduled</Badge>;
  };

  const formatLong = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const formatStamp = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </span>
            Doctor's Notes
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Read Only
                </Badge>
              </TooltipTrigger>
              <TooltipContent>View Only — added by your doctor</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="h-24 animate-pulse rounded-md bg-muted/40" />
          ) : !note ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-lg bg-muted/30 border border-dashed">
              <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No notes yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Your doctor hasn't added any notes yet. Notes will appear here after your consultation.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Clinical Observations */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Clinical Observations</h4>
                </div>
                <div className="rounded-md bg-muted/40 border p-3 text-sm whitespace-pre-wrap text-foreground/90 min-h-[3rem]">
                  {note.note || <span className="text-muted-foreground italic">No observations recorded.</span>}
                </div>
              </section>

              {/* Treatment Plan */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Treatment Plan</h4>
                </div>
                <div className="rounded-md bg-muted/40 border p-3 text-sm whitespace-pre-wrap text-foreground/90 min-h-[3rem]">
                  {note.treatment_plan || <span className="text-muted-foreground italic">No plan provided.</span>}
                </div>
              </section>

              {/* Follow-up */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Next Appointment</h4>
                </div>
                <div className="rounded-md bg-muted/40 border p-3 text-sm flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {note.follow_up_date ? formatLong(note.follow_up_date) : (
                      <span className="text-muted-foreground italic">Not scheduled.</span>
                    )}
                  </span>
                  {followupBadge()}
                </div>
              </section>

              <p className="text-xs text-muted-foreground pt-2 border-t">
                Added by your doctor · Last updated: {formatStamp(note.updated_at)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
