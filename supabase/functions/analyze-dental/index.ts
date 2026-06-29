import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageDataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${base64Data}`;

    const systemPrompt = `You are an expert dental AI assistant specialized in detecting dental caries (tooth decay/cavities) from images. You have been trained on thousands of dental images and can accurately identify signs of decay.

Your task is to analyze dental/teeth images and provide accurate assessments. Be thorough and precise in your analysis.`;

    const userPrompt = `Analyze this dental/teeth image carefully and provide a detailed assessment.

Evaluate the image and determine:
1. Whether dental caries (cavities/tooth decay) is present - look for:
   - White spots (early demineralization)
   - Brown or black discoloration
   - Visible holes or cavities
   - Rough or damaged enamel surface
   - Dark areas between teeth

2. If caries is detected, classify the stage:
   - "initial" = Early demineralization, white spots, very early decay, can be reversed with proper care
   - "moderate" = Visible cavity, brown/black spots, decay has reached dentin, needs dental treatment
   - "severe" = Deep cavity, extensive damage, possible infection, requires immediate dental attention

3. If no caries is detected and teeth appear healthy, use stage "healthy"

4. Provide a confidence score (0-100) based on image clarity and your certainty

You MUST respond with ONLY a valid JSON object (no markdown, no explanation, just the JSON):
{
  "hasCaries": boolean,
  "stage": "healthy" | "initial" | "moderate" | "severe",
  "confidence": number between 0 and 100,
  "description": "Detailed description of what you observed in the image",
  "affectedAreas": "Specific teeth or areas affected (e.g., 'upper right molar', 'between front teeth')",
  "recommendations": ["Array of 3-4 specific actionable recommendations based on your findings"]
}`;

    // Call Google Gemini API directly via OpenAI compatibility layer
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a few seconds.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the text response
    const textResponse = data.choices?.[0]?.message?.content;
    
    if (!textResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', textResponse);

    // Parse the JSON response
    let analysisResult;
    try {
      // Clean the response - remove any markdown code blocks if present
      const cleanedResponse = textResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      analysisResult = JSON.parse(cleanedResponse);
      
      // Validate and sanitize the response
      analysisResult = {
        hasCaries: Boolean(analysisResult.hasCaries),
        stage: ['healthy', 'initial', 'moderate', 'severe'].includes(analysisResult.stage) 
          ? analysisResult.stage 
          : (analysisResult.hasCaries ? 'moderate' : 'healthy'),
        confidence: Math.min(100, Math.max(0, Number(analysisResult.confidence) || 75)),
        description: String(analysisResult.description || 'Analysis completed successfully.'),
        affectedAreas: String(analysisResult.affectedAreas || 'No specific areas identified.'),
        recommendations: Array.isArray(analysisResult.recommendations) 
          ? analysisResult.recommendations.slice(0, 5).map(String)
          : ['Consult a dentist for professional evaluation.']
      };
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', textResponse, parseError);
      
      // Attempt to extract information from the text response
      const lowerText = textResponse.toLowerCase();
      const hasCaries = lowerText.includes('caries') && !lowerText.includes('no caries');
      const isSevere = lowerText.includes('severe');
      const isModerate = lowerText.includes('moderate');
      const isInitial = lowerText.includes('initial') || lowerText.includes('early');
      
      analysisResult = {
        hasCaries: hasCaries,
        stage: hasCaries ? (isSevere ? 'severe' : isModerate ? 'moderate' : isInitial ? 'initial' : 'moderate') : 'healthy',
        confidence: 70,
        description: textResponse.slice(0, 500),
        affectedAreas: 'Please consult a dentist for precise identification.',
        recommendations: [
          'Visit a dentist for a thorough examination',
          'Maintain regular brushing twice daily',
          'Use fluoride toothpaste',
          'Floss daily'
        ]
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Dental analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});