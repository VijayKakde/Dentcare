import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, User, FileText, Calendar, Loader2, AlertCircle, Stethoscope, Clock, Activity, Camera, ImageOff, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/browserClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PatientProfile {
  id: string;
  user_id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  medical_history: string | null;
  allergies: string | null;
  created_at: string;
}

interface DentalReport {
  id: string;
  scan_id: string;
  image_url: string | null;
  has_caries: boolean;
  stage: string | null;
  confidence: number | null;
  description: string | null;
  affected_areas: string | null;
  recommendations: string[] | null;
  doctor_notes: string | null;
  created_at: string;
}

interface TreatmentNote {
  id: string;
  note: string;
  treatment_plan: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at?: string;
}

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [reports, setReports] = useState<DentalReport[]>([]);
  const [treatmentNotes, setTreatmentNotes] = useState<TreatmentNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newTreatmentPlan, setNewTreatmentPlan] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const searchPatient = async () => {
    const term = searchId.trim().toLowerCase();

    if (!term) {
      toast.error('Please enter a patient ID');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setPatient(null);
    setReports([]);
    setTreatmentNotes([]);

    try {
      // NOTE: user_id is a UUID column; Postgres does not support ILIKE directly on UUID.
      // We fetch a small batch and match the prefix in JS.
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (profileError) throw profileError;

      const matchedProfile = (profiles as PatientProfile[] | null)?.find((p) =>
        (p.user_id || '').toLowerCase().startsWith(term)
      );

      if (!matchedProfile) {
        setSearchError('No patient found with this ID');
        setIsSearching(false);
        return;
      }

      const patientData = matchedProfile as PatientProfile;
      setPatient(patientData);

      // Fetch dental reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('dental_reports')
        .select('*')
        .eq('user_id', patientData.user_id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setReports((reportsData as DentalReport[]) || []);

      // Fetch treatment notes
      const { data: notesData, error: notesError } = await supabase
        .from('treatment_notes')
        .select('*')
        .eq('patient_id', patientData.user_id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      const notes = (notesData as TreatmentNote[]) || [];
      setTreatmentNotes(notes);

      // Pre-fill current doctor's existing note (if any) so editing acts as update
      const myNote = notes.find((n: any) => n.doctor_id === user?.id);
      if (myNote) {
        setNewNote(myNote.note || '');
        setNewTreatmentPlan(myNote.treatment_plan || '');
        setFollowUpDate(myNote.follow_up_date || '');
        setLastSavedAt((myNote as any).updated_at || myNote.created_at);
      } else {
        setNewNote('');
        setNewTreatmentPlan('');
        setFollowUpDate('');
        setLastSavedAt(null);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchError(error?.message || 'Failed to search patient');
    } finally {
      setIsSearching(false);
    }
  };

  const addTreatmentNote = async () => {
    if (!patient || !user || !newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setIsSavingNote(true);

    const { data, error } = await supabase
      .from('treatment_notes')
      .upsert(
        {
          patient_id: patient.user_id,
          doctor_id: user.id,
          note: newNote,
          treatment_plan: newTreatmentPlan || null,
          follow_up_date: followUpDate || null,
        },
        { onConflict: 'patient_id,doctor_id' }
      )
      .select()
      .single();

    setIsSavingNote(false);

    if (error) {
      toast.error('Failed to save treatment note');
      console.error('Note save error:', error);
    } else {
      toast.success('Treatment note saved — patient can now view this');
      setLastSavedAt((data as any)?.updated_at || new Date().toISOString());

      // Refresh notes
      const { data: notesData } = await supabase
        .from('treatment_notes')
        .select('*')
        .eq('patient_id', patient.user_id)
        .order('created_at', { ascending: false });

      setTreatmentNotes((notesData as TreatmentNote[]) || []);
    }
  };

  const formatStamp = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStageBadge = (stage: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      healthy: 'default',
      initial: 'secondary',
      moderate: 'outline',
      severe: 'destructive',
    };
    const colors: Record<string, string> = {
      healthy: 'bg-green-500/10 text-green-600 border-green-500/20',
      initial: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      moderate: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      severe: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return (
      <Badge className={colors[stage || 'healthy']} variant="outline">
        {stage || 'healthy'}
      </Badge>
    );
  };

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
            <p className="text-muted-foreground">Search and manage patient records</p>
          </div>
        </div>

        {/* Patient Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Patient Lookup
            </CardTitle>
            <CardDescription>
              Enter the first 8 characters of the patient's ID to search
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter Patient ID (e.g., A1B2C3D4)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && searchPatient()}
                  className="uppercase"
                />
              </div>
              <Button onClick={searchPatient} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
            {searchError && (
              <div className="flex items-center gap-2 mt-4 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{searchError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Details */}
        {patient && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Tabs defaultValue="info" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="info">Patient Info</TabsTrigger>
                <TabsTrigger value="reports">Scan Reports</TabsTrigger>
                <TabsTrigger value="notes">Treatment Notes</TabsTrigger>
              </TabsList>

              {/* Patient Info Tab */}
              <TabsContent value="info">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {patient.full_name}
                    </CardTitle>
                    <CardDescription>
                      Patient ID: {patient.user_id.slice(0, 8).toUpperCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Age</label>
                          <p className="font-medium">{patient.age || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Gender</label>
                          <p className="font-medium capitalize">{patient.gender || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Phone</label>
                          <p className="font-medium">{patient.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Address</label>
                          <p className="font-medium">{patient.address || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-muted-foreground flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Medical History
                          </label>
                          <p className="font-medium text-sm bg-muted p-3 rounded-md mt-1">
                            {patient.medical_history || 'No medical history recorded'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Allergies
                          </label>
                          <p className="font-medium text-sm bg-destructive/10 text-destructive p-3 rounded-md mt-1">
                            {patient.allergies || 'No known allergies'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Registered Since</label>
                          <p className="font-medium">
                            {format(new Date(patient.created_at), 'PPP')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scan Reports Tab */}
              <TabsContent value="reports">
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No dental scan reports found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    reports.map((report) => (
                      <Card key={report.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Scan #{report.scan_id}</CardTitle>
                            {getStageBadge(report.stage)}
                          </div>
                          <CardDescription>
                            {format(new Date(report.created_at), 'PPpp')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            {/* Left Column: Image (40%) */}
                            <div className="md:col-span-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Camera className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Uploaded Teeth Image</span>
                              </div>
                              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                                {report.image_url ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setLightboxImage(report.image_url!)}
                                      className="block w-full overflow-hidden rounded-[10px] group"
                                    >
                                      <img
                                        src={report.image_url}
                                        alt="Patient uploaded teeth scan"
                                        className="w-full max-h-80 object-contain bg-muted/40 transition-transform duration-300 group-hover:scale-[1.02]"
                                      />
                                    </button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Image uploaded by patient during scan
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-3 w-full"
                                      onClick={() => setLightboxImage(report.image_url!)}
                                    >
                                      <Maximize2 className="h-3.5 w-3.5 mr-2" />
                                      View Full Size
                                    </Button>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                    <ImageOff className="h-10 w-10 mb-2" />
                                    <p className="text-sm text-center">No image available for this report</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Column: Details (60%) */}
                            <div className="md:col-span-3 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm text-muted-foreground">Caries Detected</label>
                                  <p className="font-medium">{report.has_caries ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                  <label className="text-sm text-muted-foreground">Confidence</label>
                                  <p className="font-medium">{report.confidence ? `${report.confidence}%` : 'N/A'}</p>
                                </div>
                              </div>
                              {report.description && (
                                <div>
                                  <label className="text-sm text-muted-foreground">Description</label>
                                  <p className="text-sm mt-1">{report.description}</p>
                                </div>
                              )}
                              {report.affected_areas && (
                                <div>
                                  <label className="text-sm text-muted-foreground">Affected Areas</label>
                                  <p className="text-sm mt-1">{report.affected_areas}</p>
                                </div>
                              )}
                              {report.recommendations && report.recommendations.length > 0 && (
                                <div>
                                  <label className="text-sm text-muted-foreground">AI Recommendations</label>
                                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                                    {report.recommendations.map((rec, idx) => (
                                      <li key={idx}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Lightbox */}
                <Dialog open={!!lightboxImage} onOpenChange={(o) => !o && setLightboxImage(null)}>
                  <DialogContent className="max-w-4xl p-2 bg-background">
                    {lightboxImage && (
                      <img
                        src={lightboxImage}
                        alt="Teeth scan full size"
                        className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* Treatment Notes Tab */}
              <TabsContent value="notes">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Add Treatment Note</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Clinical Notes</label>
                      <Textarea
                        placeholder="Enter clinical observations and notes..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Treatment Plan</label>
                      <Textarea
                        placeholder="Recommended treatment plan..."
                        value={newTreatmentPlan}
                        onChange={(e) => setNewTreatmentPlan(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Follow-up Date</label>
                      <Input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button onClick={addTreatmentNote} disabled={isSavingNote} className="w-fit">
                        {isSavingNote ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Save Note
                      </Button>
                      {lastSavedAt && (
                        <p className="text-xs text-muted-foreground">
                          Last updated: {formatStamp(lastSavedAt)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {treatmentNotes.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No treatment notes yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    treatmentNotes.map((note) => (
                      <Card key={note.id}>
                        <CardHeader className="pb-3">
                          <CardDescription>
                            {format(new Date(note.created_at), 'PPpp')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-sm text-muted-foreground">Notes</label>
                            <p className="text-sm mt-1">{note.note}</p>
                          </div>
                          {note.treatment_plan && (
                            <div>
                              <label className="text-sm text-muted-foreground">Treatment Plan</label>
                              <p className="text-sm mt-1">{note.treatment_plan}</p>
                            </div>
                          )}
                          {note.follow_up_date && (
                            <div>
                              <label className="text-sm text-muted-foreground">Follow-up</label>
                              <p className="text-sm mt-1 flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(note.follow_up_date), 'PPP')}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
