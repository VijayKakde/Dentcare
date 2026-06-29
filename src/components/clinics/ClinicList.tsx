import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Globe, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clinic } from '@/services/clinicService';
import { cn } from '@/lib/utils';

interface ClinicListProps {
  clinics: Clinic[];
  selectedClinicId: string | null;
  onClinicSelect: (clinicId: string) => void;
}

export function ClinicList({
  clinics,
  selectedClinicId,
  onClinicSelect,
}: ClinicListProps) {
  const { t } = useTranslation();

  if (clinics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          {t('clinics.noClinicsFound', 'No dental clinics found nearby')}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t('clinics.tryExpandingSearch', 'Try expanding your search radius')}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {clinics.map((clinic) => (
          <button
            key={clinic.id}
            onClick={() => onClinicSelect(clinic.id)}
            className={cn(
              'w-full text-left p-4 rounded-xl border transition-all duration-200',
              'hover:border-primary/50 hover:bg-primary/5',
              selectedClinicId === clinic.id
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border bg-card'
            )}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{clinic.name}</h3>
                
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{clinic.distance} km away</span>
                </div>

                {clinic.address && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {clinic.address}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {clinic.phone && (
                    <a
                      href={`tel:${clinic.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {clinic.phone}
                    </a>
                  )}
                  
                  {clinic.website && (
                    <a
                      href={clinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>

                {clinic.openingHours && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="truncate">{clinic.openingHours}</span>
                  </div>
                )}
              </div>

              <div className="shrink-0 px-2 py-1 bg-primary/10 rounded-full">
                <span className="text-xs font-medium text-primary">
                  {clinic.distance} km
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
