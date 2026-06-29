import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Trash2, ChevronRight, Scan, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ReportDetailView } from '@/components/reports/ReportDetailView';
import { ReportData } from '@/components/reports/DentalReport';
import { supabase } from '@/integrations/supabase/browserClient';
import { useAuth } from '@/contexts/AuthContext';
import DoctorNotes from '@/components/DoctorNotes';

type Report = ReportData;

export default function ReportsPage() {
  const { t } = useTranslation();
  const { user, profile, role } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch reports from database - RLS ensures users only see their own
        const { data, error } = await supabase
          .from('dental_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Map database records to Report format
        const mappedReports: Report[] = (data || []).map((r) => ({
          scanId: r.scan_id,
          dateTime: r.created_at,
          hasCaries: r.has_caries,
          stage: r.stage as 'initial' | 'moderate' | 'severe' | undefined,
          confidence: r.confidence || 0,
          imageUrl: r.image_url || '',
          description: r.description || undefined,
          affectedAreas: r.affected_areas || undefined,
          recommendations: r.recommendations || undefined,
          patientInfo: profile ? {
            patientId: `P-${user.id.substring(0, 8).toUpperCase()}`,
            name: profile.full_name || 'Patient',
            age: profile.age || 0,
            gender: (profile.gender as 'Male' | 'Female' | 'Other') || 'Other',
          } : undefined,
        }));

        setReports(mappedReports);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, profile]);

  const deleteReport = async (scanId: string) => {
    try {
      const { error } = await supabase
        .from('dental_reports')
        .delete()
        .eq('scan_id', scanId);

      if (error) throw error;

      const updated = reports.filter(r => r.scanId !== scanId);
      setReports(updated);
      if (selectedReport?.scanId === scanId) {
        setSelectedReport(null);
        setShowDetailView(false);
      }
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const handleViewFullReport = (report: Report) => {
    setSelectedReport(report);
    setShowDetailView(true);
  };

  const handleBackFromDetailView = () => {
    setShowDetailView(false);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stageConfig = {
    initial: { label: t('results.stages.initial'), className: 'stage-initial', color: 'text-success' },
    moderate: { label: t('results.stages.moderate'), className: 'stage-moderate', color: 'text-warning' },
    severe: { label: t('results.stages.severe'), className: 'stage-severe', color: 'text-destructive' },
  };

  // Show full report view
  if (showDetailView && selectedReport) {
    return (
      <ReportDetailView 
        report={selectedReport} 
        onBack={handleBackFromDetailView} 
      />
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t('reports.title')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('reports.subtitle')}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">
              {t('reports.noReports')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('reports.noReportsDesc')}
            </p>
            <Link to="/scan">
              <Button className="btn-primary-gradient">
                <Scan className="mr-2 h-5 w-5" />
                {t('reports.startScan')}
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Reports list */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              {reports.map((report, index) => (
                <motion.div
                  key={report.scanId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedReport(report)}
                  className={`
                    medical-card-hover p-4 cursor-pointer
                    ${selectedReport?.scanId === report.scanId ? 'ring-2 ring-primary' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={report.imageUrl}
                        alt="Scan"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium truncate">
                          {report.scanId}
                        </span>
                        {report.hasCaries ? (
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-success shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(report.dateTime)}
                      </div>
                      
                      {report.hasCaries && report.stage && (
                        <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${stageConfig[report.stage].className}`}>
                          {stageConfig[report.stage].label}
                        </span>
                      )}
                    </div>
                    
                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Report detail */}
            <AnimatePresence mode="wait">
              {selectedReport && (
                <motion.div
                  key={selectedReport.scanId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="medical-card p-6 lg:sticky lg:top-24"
                >
                  <h2 className="font-display text-xl font-bold mb-4">
                    {t('reports.viewDetails')}
                  </h2>
                  
                  {/* Image */}
                  <div className="rounded-xl overflow-hidden mb-6">
                    <img
                      src={selectedReport.imageUrl}
                      alt="Scan"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  
                  {/* Result */}
                  <div className={`text-center p-4 rounded-xl mb-4 ${selectedReport.hasCaries ? 'bg-destructive/10' : 'bg-success/10'}`}>
                    <p className={`font-bold ${selectedReport.hasCaries ? 'text-destructive' : 'text-success'}`}>
                      {selectedReport.hasCaries ? t('results.cariesDetected') : t('results.noCaries')}
                    </p>
                    {selectedReport.hasCaries && selectedReport.stage && (
                      <span className={`inline-block mt-2 text-sm px-3 py-1 rounded-full ${stageConfig[selectedReport.stage].className}`}>
                        {stageConfig[selectedReport.stage].label}
                      </span>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">{t('results.scanId')}</p>
                      <p className="font-mono text-sm font-medium">{selectedReport.scanId}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">{t('results.confidence')}</p>
                      <p className="font-bold text-primary">{selectedReport.confidence}%</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-4">
                    {formatDate(selectedReport.dateTime)}
                  </p>
                  
                  {/* Actions */}
                  <div className="space-y-3">
                    {/* View Full Report Button */}
                    <Button 
                      className="w-full btn-primary-gradient"
                      onClick={() => handleViewFullReport(selectedReport)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Full Report
                    </Button>
                    
                    {/* Delete button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('reports.delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this scan report.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteReport(selectedReport.scanId)}>
                            {t('reports.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Doctor's Notes — patient view only */}
        {user && role !== 'doctor' && (
          <div className="mt-10 max-w-3xl mx-auto">
            <DoctorNotes patientId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
