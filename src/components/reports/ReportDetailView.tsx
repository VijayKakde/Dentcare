import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DentalReport, ReportData } from './DentalReport';

type ReportDetailViewProps = {
  report: ReportData;
  onBack: () => void;
};

export function ReportDetailView({ report, onBack }: ReportDetailViewProps) {
  const { t } = useTranslation();
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen py-6"
    >
      {/* Actions Bar - Hidden on print */}
      <div className="container px-4 mb-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              {t('results.downloadPdf')}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Container */}
      <div className="container px-4">
        <div ref={reportRef} className="print:m-0">
          <DentalReport data={report} />
        </div>
      </div>
    </motion.div>
  );
}
