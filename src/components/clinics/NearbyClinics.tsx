import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClinicMap } from './ClinicMap';
import { ClinicList } from './ClinicList';
import {
  Clinic,
  UserLocation,
  getUserLocation,
  fetchNearbyClinics,
} from '@/services/clinicService';

type LoadingState = 'idle' | 'requesting-location' | 'fetching-clinics' | 'success' | 'error';

export function NearbyClinics() {
  const { t } = useTranslation();
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  const loadClinics = useCallback(async () => {
    try {
      setLoadingState('requesting-location');
      setError(null);

      const location = await getUserLocation();
      setUserLocation(location);

      setLoadingState('fetching-clinics');
      const nearbyClinics = await fetchNearbyClinics(location, 5);
      setClinics(nearbyClinics);

      setLoadingState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clinics');
      setLoadingState('error');
    }
  }, []);

  useEffect(() => {
    // Auto-request location when component mounts
    loadClinics();
  }, [loadClinics]);

  const handleClinicSelect = (clinicId: string) => {
    setSelectedClinicId(clinicId);
  };

  const renderContent = () => {
    if (loadingState === 'idle') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            {t('clinics.enableLocation', 'Enable location to find nearby dental clinics')}
          </p>
          <Button onClick={loadClinics} className="gap-2">
            <MapPin className="h-4 w-4" />
            {t('clinics.findClinics', 'Find Nearby Clinics')}
          </Button>
        </div>
      );
    }

    if (loadingState === 'requesting-location') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">
            {t('clinics.requestingLocation', 'Requesting location access...')}
          </p>
        </div>
      );
    }

    if (loadingState === 'fetching-clinics') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">
            {t('clinics.searchingClinics', 'Searching for nearby dental clinics...')}
          </p>
        </div>
      );
    }

    if (loadingState === 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-2">
            {t('clinics.error', 'Unable to find clinics')}
          </p>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            {error}
          </p>
          <Button onClick={loadClinics} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('common.retry', 'Try Again')}
          </Button>
        </div>
      );
    }

    if (loadingState === 'success' && userLocation) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
          {/* Clinic List Sidebar */}
          <div className="lg:col-span-1 h-full border border-border rounded-xl overflow-hidden bg-card">
            <div className="p-3 border-b border-border bg-muted/50">
              <h3 className="font-semibold text-sm">
                {t('clinics.foundClinics', '{{count}} clinics found', {
                  count: clinics.length,
                })}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('clinics.withinRadius', 'Within 5km radius')}
              </p>
            </div>
            <div className="h-[calc(100%-60px)]">
              <ClinicList
                clinics={clinics}
                selectedClinicId={selectedClinicId}
                onClinicSelect={handleClinicSelect}
              />
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2 h-full">
            <ClinicMap
              userLocation={userLocation}
              clinics={clinics}
              selectedClinicId={selectedClinicId}
              onClinicSelect={handleClinicSelect}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            {t('clinics.title', 'Recommended: Visit a Nearby Dental Clinic')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">{renderContent()}</CardContent>
      </Card>
    </motion.div>
  );
}
