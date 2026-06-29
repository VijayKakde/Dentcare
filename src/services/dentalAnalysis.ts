import { supabase } from '@/integrations/supabase/browserClient';

export type PatientInfo = {
  patientId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
};

export type AnalysisResult = {
  scanId: string;
  dateTime: string;
  hasCaries: boolean;
  stage?: 'healthy' | 'initial' | 'moderate' | 'severe';
  confidence: number;
  imageUrl: string;
  description?: string;
  affectedAreas?: string;
  recommendations?: string[];
  patientInfo?: PatientInfo;
};

export type GeminiAnalysisResponse = {
  hasCaries: boolean;
  stage: 'healthy' | 'initial' | 'moderate' | 'severe';
  confidence: number;
  description: string;
  affectedAreas: string;
  recommendations: string[];
};

export async function analyzeDentalImage(imageBase64: string): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke('analyze-dental', {
    body: { imageBase64 }
  });

  if (error) {
    console.error('Analysis error:', error);
    throw new Error(error.message || 'Failed to analyze image');
  }

  if (!data.success) {
    throw new Error(data.error || 'Analysis failed');
  }

  const analysis: GeminiAnalysisResponse = data.analysis;

  // Create the result object
  const result: AnalysisResult = {
    scanId: `SCAN-${Date.now().toString(36).toUpperCase()}`,
    dateTime: new Date().toISOString(),
    hasCaries: analysis.hasCaries,
    stage: analysis.stage === 'healthy' ? undefined : analysis.stage,
    confidence: Math.round(analysis.confidence * 10) / 10,
    imageUrl: imageBase64,
    description: analysis.description,
    affectedAreas: analysis.affectedAreas,
    recommendations: analysis.recommendations
  };

  return result;
}
