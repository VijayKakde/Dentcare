import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeDentalImage, AnalysisResult, PatientInfo } from '@/services/dentalAnalysis';
import { NearbyClinics } from '@/components/clinics/NearbyClinics';
import { HeatmapVisualization } from '@/components/HeatmapVisualization';

export default function ScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file (JPG, PNG, WEBP)',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setImageFile(file);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }, [handleImageSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const clearImage = () => {
    setImage(null);
    setImageFile(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const performAnalysis = async () => {
    if (!image || !user) return;
    
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeDentalImage(image);
      
      // Add patient info from the logged-in user's profile
      const patientInfo: PatientInfo | undefined = profile ? {
        patientId: `P-${user.id.substring(0, 8).toUpperCase()}`,
        name: profile.full_name || 'Anonymous Patient',
        age: profile.age || 0,
        gender: (profile.gender as 'Male' | 'Female' | 'Other') || 'Other',
      } : undefined;
      
      const resultWithPatient: AnalysisResult = {
        ...result,
        patientInfo,
      };
      
      // Save report to the database
      const { supabase } = await import('@/integrations/supabase/browserClient');
      const { error: dbError } = await supabase.from('dental_reports').insert({
        user_id: user.id,
        scan_id: result.scanId,
        has_caries: result.hasCaries,
        stage: result.stage || 'healthy',
        confidence: result.confidence,
        description: result.description || null,
        affected_areas: result.affectedAreas || null,
        recommendations: result.recommendations || [],
        image_url: image, // Store the base64 image
      });
      
      if (dbError) {
        console.error('Failed to save report to database:', dbError);
        // Still continue - save to localStorage as backup
      }
      
      setAnalysisResult(resultWithPatient);
      
      // Also save to localStorage for offline access
      const existingReports = JSON.parse(localStorage.getItem('dentalReports') || '[]');
      existingReports.unshift(resultWithPatient);
      localStorage.setItem('dentalReports', JSON.stringify(existingReports));
      
      toast({
        title: 'Analysis Complete',
        description: 'Your dental scan has been analyzed and saved successfully.',
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());
      
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) handleImageSelect(file);
      };
      input.click();
    } catch (error) {
      toast({
        title: 'Camera not available',
        description: 'Please use the upload option instead',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t('scan.title')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('scan.subtitle')}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!image ? (
            // Upload area
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative cursor-pointer rounded-2xl border-2 border-dashed p-12 md:p-16 text-center
                  transition-all duration-300
                  ${dragActive 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
                
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                
                <p className="font-medium text-lg mb-2">{t('scan.dragDrop')}</p>
                <p className="text-muted-foreground text-sm">{t('scan.orBrowse')}</p>
                <p className="text-muted-foreground text-xs mt-2">{t('scan.supportedFormats')}</p>
              </div>

              {/* Camera button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={openCamera}
                  className="gap-2"
                >
                  <Camera className="h-5 w-5" />
                  {t('scan.camera')}
                </Button>
              </div>
            </motion.div>
          ) : (
            // Image preview and analysis
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Image preview */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border">
                <img
                  src={image}
                  alt="Uploaded teeth"
                  className="w-full h-auto max-h-[400px] object-contain bg-muted"
                />
                
                {/* Scanning animation overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-primary/30 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      </div>
                      <div className="pulse-ring" />
                    </div>
                    <p className="mt-4 font-medium text-foreground">{t('scan.analyzing')}</p>
                    
                    {/* Scan line animation */}
                    <div className="absolute inset-x-0 h-1 bg-primary/50 animate-scan-line blur-sm" />
                  </div>
                )}
                
                {/* Clear button */}
                {!isAnalyzing && (
                  <button
                    onClick={clearImage}
                    className="absolute top-4 right-4 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Quality indicator */}
              {!analysisResult && !isAnalyzing && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-success/10 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('scan.qualityGood')}</span>
                </div>
              )}

              {/* Actions */}
              {!analysisResult && !isAnalyzing && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={clearImage}>
                    {t('scan.reupload')}
                  </Button>
                  <Button className="btn-primary-gradient" onClick={performAnalysis}>
                    {t('scan.startAnalysis')}
                  </Button>
                </div>
              )}

              {/* Results */}
              {analysisResult && (
                <AnalysisResults result={analysisResult} onScanAgain={clearImage} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface AnalysisResultsProps {
  result: AnalysisResult;
  onScanAgain: () => void;
}

function AnalysisResults({ result, onScanAgain }: AnalysisResultsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const stageConfig = {
    initial: { label: t('results.stages.initial'), className: 'stage-initial', emoji: '🟢' },
    moderate: { label: t('results.stages.moderate'), className: 'stage-moderate', emoji: '🟡' },
    severe: { label: t('results.stages.severe'), className: 'stage-severe', emoji: '🔴' },
  };

  // Use AI-generated recommendations if available, otherwise use defaults
  const getRecommendations = () => {
    if (result.recommendations && result.recommendations.length > 0) {
      return result.recommendations;
    }
    
    // Fallback recommendations
    const defaultRecommendations = {
      initial: [
        'Use fluoride toothpaste',
        'Reduce sugar intake',
        'Schedule a dental check-up within 3 months',
      ],
      moderate: [
        'Visit a dentist within 2-4 weeks',
        'Avoid extremely hot or cold foods',
        'Maintain strict oral hygiene',
      ],
      severe: [
        'Seek dental care immediately',
        'Avoid hard or chewy foods on affected area',
        'Take pain relief if needed',
      ],
      noCaries: [
        'Continue regular brushing and flossing',
        'Maintain regular dental check-ups',
        'Keep a balanced diet',
      ],
    };
    
    return result.hasCaries && result.stage
      ? defaultRecommendations[result.stage]
      : defaultRecommendations.noCaries;
  };

  const currentRecommendations = getRecommendations();
  
  // Use AI-generated description if available
  const currentExplanation = result.description || (
    result.hasCaries && result.stage 
      ? `${result.stage.charAt(0).toUpperCase() + result.stage.slice(1)} stage caries detected. Please consult a dentist for proper treatment.`
      : 'No signs of dental caries detected. Continue maintaining good oral hygiene.'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="medical-card p-6 space-y-6"
    >
      <h2 className="font-display text-2xl font-bold text-center">
        {t('results.title')}
      </h2>

      {/* Main result */}
      <div className={`text-center p-6 rounded-xl ${result.hasCaries ? 'bg-destructive/10' : 'bg-success/10'}`}>
        <div className="text-4xl mb-2">
          {result.hasCaries ? '⚠️' : '✅'}
        </div>
        <p className={`text-xl font-bold ${result.hasCaries ? 'text-destructive' : 'text-success'}`}>
          {result.hasCaries ? t('results.cariesDetected') : t('results.noCaries')}
        </p>
        
        {result.hasCaries && result.stage && (
          <div className={`inline-block mt-3 px-4 py-2 rounded-full ${stageConfig[result.stage].className}`}>
            {stageConfig[result.stage].emoji} {stageConfig[result.stage].label}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-muted/50">
          <p className="text-sm text-muted-foreground mb-1">{t('results.scanId')}</p>
          <p className="font-mono font-medium">{result.scanId}</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50">
          <p className="text-sm text-muted-foreground mb-1">{t('results.confidence')}</p>
          <p className="font-bold text-primary">{result.confidence}%</p>
        </div>
      </div>

      {/* AI Analysis Visualization */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <h3 className="font-semibold mb-3 text-center">AI Analysis Visualization</h3>
        <HeatmapVisualization
          imageUrl={result.imageUrl}
          stage={result.stage}
          confidence={result.confidence}
        />
      </div>

      {/* Affected Areas (if caries detected) */}
      {result.hasCaries && result.affectedAreas && (
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
          <h3 className="font-semibold mb-2 text-destructive">Affected Areas</h3>
          <p className="text-sm text-muted-foreground">{result.affectedAreas}</p>
        </div>
      )}

      {/* Explanation */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <h3 className="font-semibold mb-2">{t('results.explanation')}</h3>
        <p className="text-sm text-muted-foreground">{currentExplanation}</p>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="font-semibold mb-3">{t('results.recommendations')}</h3>
        <ul className="space-y-2">
          {currentRecommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onScanAgain} className="flex-1">
          {t('results.scanAgain')}
        </Button>
        <Button onClick={() => navigate('/reports')} className="flex-1 btn-primary-gradient">
          {t('home.reportsButton')}
        </Button>
      </div>

      {/* Nearby Clinics Section */}
      <div className="mt-6">
        <NearbyClinics />
      </div>
    </motion.div>
  );
}
