import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

async function prioritizeWithOpenAI(
  payload: any,
  options: { apiKey: string; baseUrl?: string; model?: string }
) {
  const baseUrl = (options.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const systemPrompt = `You are the Lead Safety & Facilities AI Officer for the CampusFix University Maintenance System.
Analyze reported incidents, compute prioritization (critical, high, medium, low), score (10-100), technical justification, and immediate recommended action.
Statutory rule: Software does not independently certify chemical or water safety.
Respond strictly in valid raw JSON with keys:
{
  "priority": "critical" | "high" | "medium" | "low",
  "score": number between 10 and 100,
  "reason": "1-2 sentence concise technical explanation of the priority decision",
  "recommendedAction": "immediate operational recommendation",
  "isWaterContaminationAlert": boolean
}`;

  const userPrompt = `Analyze this reported maintenance issue:
- Title: "${payload.title || 'N/A'}"
- Description: "${payload.description || 'N/A'}"
- Category: "${payload.category || 'General'}"
- Campus Area: "${payload.campusArea || 'Campus'}"
- Specific Location: "${payload.specificLocation || 'Unknown'}"
- Severity: "${payload.severity || 'medium'}"
- Estimated Occupants/People Affected: ${payload.affectedPeople || 1}
- Water Related Issue: ${payload.isWaterIssue ? 'YES' : 'NO'}
- Suspected Water Contamination Flag: ${payload.suspectedContamination ? 'YES - EMERGENCY' : 'NO'}`;

  const requestBody: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2
  };

  if (!model.includes('instruct')) {
    requestBody.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content?.trim() || '';
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('OpenAI did not return valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    ...parsed,
    source: `openai-${model}`,
  };
}

export default async function handler(req: any, res: any) {
  // CORS & Methods
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      title,
      description,
      category,
      campusArea,
      specificLocation,
      severity,
      affectedPeople,
      isWaterIssue,
      suspectedContamination,
      provider = 'auto',
      openaiApiKey,
      openaiBaseUrl,
      openaiModel
    } = body;

    const payload = {
      title,
      description,
      category,
      campusArea,
      specificLocation,
      severity,
      affectedPeople,
      isWaterIssue,
      suspectedContamination
    };

    // 1. OpenAI if configured
    const effectiveOpenAiKey = openaiApiKey || process.env.OPENAI_API_KEY;
    if ((provider === 'openai' || provider === 'auto') && effectiveOpenAiKey) {
      try {
        const openAiResult = await prioritizeWithOpenAI(payload, {
          apiKey: effectiveOpenAiKey,
          baseUrl: openaiBaseUrl,
          model: openaiModel
        });
        return res.status(200).json({
          success: true,
          ...openAiResult
        });
      } catch (openAiErr: any) {
        console.warn('OpenAI error, falling back:', openAiErr.message);
        if (provider === 'openai') {
          return res.status(400).json({
            success: false,
            error: `OpenAI API request failed: ${openAiErr.message}`
          });
        }
      }
    }

    // 2. Gemini if configured
    if (provider === 'gemini' || provider === 'auto') {
      const ai = getGenAIClient();
      if (ai) {
        try {
          const prompt = `You are the Lead Safety & Facilities Engineer for a university campus.
Analyze this reported maintenance issue:
- Title: "${title || 'N/A'}"
- Description: "${description || 'N/A'}"
- Category: "${category || 'General'}"
- Campus Area: "${campusArea || 'Campus'}"
- Specific Location: "${specificLocation || 'Unknown'}"
- Severity: "${severity || 'medium'}"
- Occupants Affected: ${affectedPeople || 1}
- Water Issue: ${isWaterIssue ? 'YES' : 'NO'}
- Suspected Contamination: ${suspectedContamination ? 'YES - EMERGENCY' : 'NO'}

Respond strictly in valid JSON:
{
  "priority": "critical" | "high" | "medium" | "low",
  "score": number between 10 and 100,
  "reason": "1-2 sentence concise explanation",
  "recommendedAction": "immediate operational recommendation",
  "isWaterContaminationAlert": boolean
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });

          const text = response.text?.trim();
          if (text) {
            const parsed = JSON.parse(text);
            return res.status(200).json({
              success: true,
              source: 'gemini-3.8-flash-ai',
              ...parsed,
            });
          }
        } catch (geminiErr: any) {
          console.warn('Gemini note, using heuristics:', geminiErr.message);
        }
      }
    }

    // 3. Fallback Heuristics Engine
    let fallbackScore = 35;
    let fallbackPriority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    const reasons: string[] = [];

    if (suspectedContamination) {
      fallbackScore = 95;
      fallbackPriority = 'critical';
      reasons.push('Emergency suspected water contamination alert');
    } else if (severity === 'critical') {
      fallbackScore = 80;
      fallbackPriority = 'critical';
      reasons.push('User reported critical safety threat');
    } else if (severity === 'high' || affectedPeople >= 50) {
      fallbackScore = 65;
      fallbackPriority = 'high';
      reasons.push(`High campus impact affecting ${affectedPeople || 50}+ people`);
    } else if (severity === 'medium') {
      fallbackScore = 40;
      fallbackPriority = 'medium';
      reasons.push('Standard facilities maintenance queue');
    } else {
      fallbackScore = 20;
      fallbackPriority = 'low';
      reasons.push('Routine cosmetic or non-critical maintenance');
    }

    return res.status(200).json({
      success: true,
      source: 'intelligent-heuristics-engine',
      priority: fallbackPriority,
      score: fallbackScore,
      reason: reasons.join(' • '),
      recommendedAction: suspectedContamination
        ? 'Dispatch emergency water quality sampling team immediately.'
        : 'Assign to relevant departmental crew for standard inspection.',
      isWaterContaminationAlert: !!suspectedContamination,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'AI prioritization error',
    });
  }
}
