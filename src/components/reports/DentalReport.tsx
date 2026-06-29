import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { HeatmapVisualization } from '@/components/HeatmapVisualization';

export type ReportData = {
  scanId: string;
  dateTime: string;
  hasCaries: boolean;
  stage?: 'initial' | 'moderate' | 'severe';
  confidence: number;
  imageUrl: string;
  description?: string;
  affectedAreas?: string;
  recommendations?: string[];
  patientInfo?: {
    patientId: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
  };
};

type DentalReportProps = {
  data: ReportData;
};

export function DentalReport({ data }: DentalReportProps) {
  const { t } = useTranslation();
  
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const { date, time } = formatDate(data.dateTime);

  const getOverallCondition = () => {
    if (!data.hasCaries) return { label: 'Healthy', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (data.stage === 'severe') return { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-200' };
    return { label: 'Needs Attention', className: 'bg-amber-100 text-amber-800 border-amber-200' };
  };

  const getSeverityLabel = () => {
    if (!data.hasCaries) return 'No Caries Detected';
    const stages = {
      initial: 'Initial Stage Caries',
      moderate: 'Moderate Stage Caries',
      severe: 'Severe Stage Caries',
    };
    return data.stage ? stages[data.stage] : 'Caries Detected';
  };

  const getTreatmentRecommendation = () => {
    if (!data.hasCaries) {
      return {
        treatment: 'Preventive Care',
        recommendation: 'Continue regular dental hygiene practices. Schedule routine check-up in 6 months.',
      };
    }
    
    const treatments = {
      initial: {
        treatment: 'Fluoride Treatment / Remineralization',
        recommendation: 'Early-stage caries detected. Recommend fluoride varnish application and improved oral hygiene. Follow-up in 3 months.',
      },
      moderate: {
        treatment: 'Dental Filling / Restoration',
        recommendation: 'Moderate decay requires professional intervention. Schedule appointment for composite or amalgam filling within 2 weeks.',
      },
      severe: {
        treatment: 'Root Canal / Crown / Extraction',
        recommendation: 'Advanced decay detected. Immediate professional evaluation required. May require endodontic treatment or extraction.',
      },
    };

    return data.stage ? treatments[data.stage] : treatments.initial;
  };

  const condition = getOverallCondition();
  const treatmentInfo = getTreatmentRecommendation();

  // Default patient info if not provided
  const patient = data.patientInfo || {
    patientId: `P-${data.scanId.replace('SCAN-', '')}`,
    name: 'Anonymous Patient',
    age: 0,
    gender: 'Other' as const,
  };

  return (
    <div className="dental-report bg-white text-gray-900 max-w-[210mm] mx-auto p-8 print:p-6 print:shadow-none shadow-lg font-sans">
      {/* Header Section */}
      <header className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-800 tracking-wide uppercase mb-1">
          AI Dental Caries Diagnostic System
        </h1>
        <p className="text-sm text-gray-500 mb-4">Advanced Computer-Aided Dental Analysis Report</p>
        
        <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
          <div className="text-left">
            <span className="font-medium">Report ID:</span> {data.scanId}
          </div>
          <div className="text-right">
            <span className="font-medium">Date:</span> {date} | <span className="font-medium">Time:</span> {time}
          </div>
        </div>
        
        <Separator className="mt-4 bg-gray-300" />
      </header>

      {/* Patient Information Section */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">
          Patient Information
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div className="flex">
            <span className="font-medium text-gray-600 w-24">Patient ID:</span>
            <span className="text-gray-800">{patient.patientId}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-600 w-24">Name:</span>
            <span className="text-gray-800">{patient.name}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-600 w-24">Age:</span>
            <span className="text-gray-800">{patient.age > 0 ? `${patient.age} years` : 'Not specified'}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-600 w-24">Gender:</span>
            <span className="text-gray-800">{patient.gender}</span>
          </div>
        </div>
      </section>

      {/* Dental Scan Image Section */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">
          Dental Scan Image
        </h2>
        <div className="flex flex-col items-center">
          <div className="border border-gray-300 rounded-lg p-2 shadow-sm bg-gray-50">
            <img
              src={data.imageUrl}
              alt="Analyzed Dental Scan"
              className="max-h-48 w-auto rounded object-contain"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">Fig. 1: Analyzed Dental Scan</p>
        </div>
      </section>

      {/* AI Analysis Visualization */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">
          AI Analysis Visualization
        </h2>
        <HeatmapVisualization
          imageUrl={data.imageUrl}
          stage={data.stage}
          confidence={data.confidence}
          compact
        />
        <p className="text-xs text-gray-500 mt-2 italic text-center">
          Fig. 2: Original dental scan compared with the AI focus-area heatmap used to derive the diagnosis.
        </p>
      </section>

      {/* Detection & Diagnosis Summary */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">
          Detection & Diagnosis Summary
        </h2>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium text-gray-600 w-1/3">Detection Result:</td>
                <td className="py-2 text-gray-800">
                  {data.hasCaries ? (
                    <span className="text-red-700 font-medium">Caries Detected</span>
                  ) : (
                    <span className="text-emerald-700 font-medium">No Caries Detected</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium text-gray-600">Highest Severity:</td>
                <td className="py-2 text-gray-800 font-medium">{getSeverityLabel()}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium text-gray-600">Confidence Score:</td>
                <td className="py-2 text-gray-800">{data.confidence}%</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium text-gray-600">Affected Areas:</td>
                <td className="py-2 text-gray-800">{data.affectedAreas || 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-gray-600">Overall Condition:</td>
                <td className="py-2">
                  <Badge variant="outline" className={`${condition.className} font-medium`}>
                    {condition.label}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
          
          {data.description && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-1">Clinical Observations:</p>
              <p className="text-sm text-gray-700 leading-relaxed">{data.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* Treatment Recommendation Section */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">
          Treatment Recommendation
        </h2>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 font-medium text-gray-600 w-1/3">Suggested Treatment:</td>
                <td className="py-2 text-gray-800 font-medium">{treatmentInfo.treatment}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-gray-600 align-top">Recommendation:</td>
                <td className="py-2 text-gray-700 leading-relaxed">{treatmentInfo.recommendation}</td>
              </tr>
            </tbody>
          </table>
          
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Additional Recommendations:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {data.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t-2 border-gray-300">
        <div className="text-center">
          <p className="text-xs text-gray-500 leading-relaxed mb-3 px-4">
            <strong>Disclaimer:</strong> This report is generated by an AI diagnostic system and should be verified by a certified dentist before clinical use. The AI analysis is intended to assist healthcare professionals and should not replace professional medical judgment.
          </p>
          <Separator className="my-3 bg-gray-200" />
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>AI Dental Caries Diagnostic System</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
