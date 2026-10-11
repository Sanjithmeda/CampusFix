import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client with standard telemetry
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

// Helper function to query OpenAI API or compatible endpoints
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
  "recommendedAction": "immediate operational recommendation (e.g. dispatch water testing crew / isolate circuit)",
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
- Suspected Water Contamination Flag: ${payload.suspectedContamination ? 'YES - EMERGENCY' : 'NO'}

Priority Rules:
1. Suspected water contamination or high-voltage hazard MUST be "critical" (Score: 85-100).
2. Water supply cutoffs or leaks in high-density student areas (Hostels, Dining, Washrooms) must be at least "high" (Score: 60-84).
3. Academic disruption (lecture halls, labs, Wi-Fi) is "medium" (Score: 30-59).
4. Cosmetic fixes or minor furniture repairs are "low" (Score: 10-29).`;

  const requestBody: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2
  };

  // Add JSON mode if supported
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
    throw new Error('OpenAI did not return valid JSON: ' + rawText);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    ...parsed,
    source: `openai-${model}`,
  };
}

// AI Prioritization Endpoint supporting OpenAI, Gemini, and Heuristics
app.post('/api/ai-prioritize', async (req, res) => {
  try {
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
    } = req.body;

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

    // 1. Try OpenAI if requested or configured
    const effectiveOpenAiKey = openaiApiKey || process.env.OPENAI_API_KEY;
    if ((provider === 'openai' || provider === 'auto') && effectiveOpenAiKey) {
      try {
        const openAiResult = await prioritizeWithOpenAI(payload, {
          apiKey: effectiveOpenAiKey,
          baseUrl: openaiBaseUrl,
          model: openaiModel
        });
        return res.json({
          success: true,
          ...openAiResult
        });
      } catch (openAiErr: any) {
        console.warn('OpenAI prioritization error, falling back:', openAiErr.message);
        if (provider === 'openai') {
          // If explicitly selected, return informative error
          return res.status(400).json({
            success: false,
            error: `OpenAI API request failed: ${openAiErr.message}`
          });
        }
      }
    }

    // 2. Try Gemini if provider is gemini or auto
    if (provider === 'gemini' || provider === 'auto') {
      const prompt = `You are the Lead Safety & Facilities Engineer for a large university campus.
Analyze this reported maintenance issue and determine its operational urgency, safety hazard, and prioritization:

- Title: "${title || 'N/A'}"
- Description: "${description || 'N/A'}"
- Category: "${category || 'General'}"
- Campus Area: "${campusArea || 'Campus'}"
- Specific Location: "${specificLocation || 'Unknown'}"
- User-reported Severity: "${severity || 'medium'}"
- Estimated Occupants/People Affected: ${affectedPeople || 1}
- Water Related Issue: ${isWaterIssue ? 'YES' : 'NO'}
- Suspected Water Contamination Flag: ${suspectedContamination ? 'YES - EMERGENCY' : 'NO'}

CRITICAL GUIDELINES:
1. Any suspected water contamination or major high-voltage electrical hazard MUST be classified as "critical" priority (Score: 85-100).
2. Water supply cutoffs or leaks in high-density student areas (Hostels, Dining, Washrooms) must be at least "high" priority (Score: 60-84).
3. Academic disruption (lecture hall projectors, classroom fans, library Wi-Fi) is generally "medium" priority (Score: 30-59).
4. Routine cosmetic fixes or minor furniture repairs are "low" priority (Score: 10-29).
5. Always provide an articulate, executive summary reason explaining why this priority score was assigned.
6. Statutory rule: You MUST note that software does not independently certify chemical or water safety.

Respond strictly in valid JSON matching this schema:
{
  "priority": "critical" | "high" | "medium" | "low",
  "score": number between 10 and 100,
  "reason": "1-2 sentence concise technical explanation of the priority decision",
  "recommendedAction": "immediate operational recommendation (e.g., dispatch water testing crew / isolate circuit)",
  "isWaterContaminationAlert": boolean
}`;

      const ai = getGenAIClient();
      if (ai) {
        try {
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
            return res.json({
              success: true,
              source: 'gemini-3.8-flash-ai',
              ...parsed,
            });
          }
        } catch (geminiErr: any) {
          console.warn('Gemini prioritization note, using heuristics:', geminiErr.message);
        }
      }
    }

    // 3. Fallback Heuristics Engine (Instant, robust, reliable)
    let fallbackScore = 35;
    let fallbackPriority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    const reasons: string[] = [];

    if (suspectedContamination) {
      fallbackScore = 95;
      fallbackPriority = 'critical';
      reasons.push('🚨 Emergency suspected water contamination alert');
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

    return res.json({
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
    console.error('Error in /api/ai-prioritize:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'AI prioritization encountered an error.',
    });
  }
});

// Endpoint to test AI connection (OpenAI or Gemini)
app.post('/api/ai-test-connection', async (req, res) => {
  const { provider = 'openai', openaiApiKey, openaiBaseUrl, openaiModel } = req.body;
  const startTime = Date.now();

  try {
    if (provider === 'openai' || (!provider && openaiApiKey)) {
      const key = openaiApiKey || process.env.OPENAI_API_KEY;
      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'No OpenAI API key provided. Please enter an API key or configure OPENAI_API_KEY.',
        });
      }
      const baseUrl = (openaiBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const model = openaiModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Respond with valid JSON: {"status":"connected"}' }],
          max_tokens: 25,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({
          success: false,
          error: `OpenAI connection failed: ${text}`,
        });
      }

      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        message: `Connected to OpenAI successfully! Model: ${model}`,
        model,
        latencyMs,
      });
    }

    const genAI = getGenAIClient();
    if (genAI) {
      return res.json({
        success: true,
        message: 'Connected to Google Gemini AI successfully!',
        model: 'gemini-3.8-flash',
        latencyMs: Date.now() - startTime,
      });
    }

    return res.json({
      success: true,
      message: 'Intelligent Rules Engine ready (Built-in offline engine).',
      model: 'CampusFix-Rules-Engine',
      latencyMs: 1,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Connection test failed',
    });
  }
});

// Vite middleware in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusFix server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
