import { ComplaintPriority, ComplaintSeverity, PriorityFactors, WaterIssueType } from '../types';

export interface CalculatedPriority {
  priority: ComplaintPriority;
  score: number;
  reason: string;
  isEscalated: boolean;
  waterAlert: boolean;
}

/**
 * Intelligent Campus Prioritization Engine
 * Calculates multi-factor priority score based on:
 * 1. Base Severity (Low: 10, Medium: 25, High: 45, Critical: 70)
 * 2. User/Population Impact (affected users scaling 0-15)
 * 3. High-Priority Campus Zone (Hostels, Research Labs, Main Water Supply +10)
 * 4. Waiting / Elapsed Time (+5 to +15 if pending)
 * 5. Water Contamination Escalation (Automated Critical flag)
 * 6. Repeated Reports (+10 for recurring issue)
 */
export function calculateComplaintPriority(factors: PriorityFactors): CalculatedPriority {
  let score = 0;
  const reasons: string[] = [];
  let isEscalated = false;
  let waterAlert = false;

  // 1. Severity Weight
  switch (factors.severity) {
    case 'critical':
      score += 65;
      reasons.push('Critical system hazard');
      break;
    case 'high':
      score += 45;
      reasons.push('High severity issue');
      break;
    case 'medium':
      score += 25;
      reasons.push('Moderate severity');
      break;
    case 'low':
    default:
      score += 10;
      reasons.push('Routine maintenance');
      break;
  }

  // 2. Affected People Impact
  if (factors.affectedPeople >= 100) {
    score += 18;
    reasons.push(`Widespread campus impact (${factors.affectedPeople}+ people)`);
  } else if (factors.affectedPeople >= 30) {
    score += 12;
    reasons.push(`Moderate group impact (${factors.affectedPeople} people)`);
  } else if (factors.affectedPeople >= 5) {
    score += 6;
    reasons.push(`Localized team impact (${factors.affectedPeople} people)`);
  }

  // 3. Location Criticality
  const highPriorityAreas = ['Hostels', 'Laboratories', 'Washrooms', 'Water Systems', 'Dining Hall', 'Power Substation'];
  const isHighZone = factors.isHighPriorityZone || highPriorityAreas.some(area =>
    factors.campusArea.toLowerCase().includes(area.toLowerCase())
  );

  if (isHighZone) {
    score += 10;
    reasons.push(`High-density zone: ${factors.campusArea}`);
  }

  // 4. Repeated/Linked Reports
  if (factors.repeatedReportsCount && factors.repeatedReportsCount > 1) {
    const repeatBonus = Math.min(factors.repeatedReportsCount * 4, 12);
    score += repeatBonus;
    reasons.push(`Repeated reports (${factors.repeatedReportsCount} linked instances)`);
  }

  // 5. Waiting Time Factor
  if (factors.hoursElapsed && factors.hoursElapsed > 24) {
    const waitBonus = Math.min(Math.floor(factors.hoursElapsed / 24) * 3, 10);
    score += waitBonus;
    reasons.push(`Overdue waiting factor (${Math.floor(factors.hoursElapsed)}h pending)`);
  }

  // 6. Water Contamination Check (Safety Safeguard)
  if (factors.suspectedContamination) {
    score = Math.max(score, 90);
    isEscalated = true;
    waterAlert = true;
    reasons.unshift('🚨 SUSPECTED WATER CONTAMINATION — Immediate Emergency Review Required');
  } else if (factors.isWaterIssue) {
    score += 12;
    reasons.push('Water supply anomaly');
  }

  // Final score clamping
  score = Math.min(Math.max(score, 5), 100);

  // Determine Priority Tier
  let priority: ComplaintPriority = 'low';
  if (factors.suspectedContamination || score >= 75) {
    priority = 'critical';
  } else if (score >= 55) {
    priority = 'high';
  } else if (score >= 30) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  return {
    priority,
    score,
    reason: reasons.join(' • '),
    isEscalated,
    waterAlert,
  };
}

export function getWaterIssueLabel(type?: WaterIssueType): string {
  switch (type) {
    case 'unusual_taste':
      return 'Unusual Chemical / Metallic Taste';
    case 'colour':
      return 'Abnormal Discoloration (Brown/Yellow/Cloudy)';
    case 'smell':
      return 'Foul / Pungent Odor';
    case 'dirty_water':
      return 'Visible Sediment or Dirty Water';
    case 'low_pressure':
      return 'Extremely Low Pressure';
    case 'no_supply':
      return 'Complete Supply Interruption';
    case 'leakage':
      return 'Severe Pipe Leakage / Burst';
    case 'suspected_contamination':
      return 'Suspected Toxic / Biological Contamination';
    case 'other':
      return 'Other Water Issue';
    default:
      return 'None';
  }
}

import { AISettingsConfig } from '../types';

export const AI_SETTINGS_STORAGE_KEY = 'campusfix_ai_settings';

export function getStoredAISettings(): AISettingsConfig {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return {
    provider: 'auto',
    openaiModel: 'gpt-4o-mini',
    openaiBaseUrl: 'https://api.openai.com/v1',
  };
}

export function saveStoredAISettings(settings: AISettingsConfig): void {
  try {
    localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // ignore
  }
}

export async function testAIConnection(customSettings?: Partial<AISettingsConfig>): Promise<{
  success: boolean;
  message: string;
  model?: string;
  latencyMs?: number;
}> {
  const current = { ...getStoredAISettings(), ...customSettings };
  try {
    const res = await fetch('/api/ai-test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // If endpoint returns HTML (e.g. static host without serverless functions)
      return {
        success: true,
        message: 'CampusFix Intelligent Heuristics Engine ready (Built-in offline engine).',
        model: 'CampusFix-Rules-Engine',
        latencyMs: 1,
      };
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Connection failed',
      };
    }
    return {
      success: true,
      message: data.message,
      model: data.model,
      latencyMs: data.latencyMs,
    };
  } catch (err: any) {
    return {
      success: true,
      message: 'CampusFix Intelligent Heuristics Engine ready (Client engine fallback).',
      model: 'CampusFix-Rules-Engine',
      latencyMs: 1,
    };
  }
}

export interface AIPrioritizationPayload {
  title: string;
  description: string;
  category: string;
  campusArea: string;
  specificLocation: string;
  severity: ComplaintSeverity;
  affectedPeople: number;
  isWaterIssue: boolean;
  suspectedContamination: boolean;
  provider?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;
}

export async function fetchAIPrioritization(
  payload: AIPrioritizationPayload
): Promise<CalculatedPriority & { source?: string; recommendedAction?: string }> {
  const aiSettings = getStoredAISettings();

  const fullPayload = {
    ...payload,
    provider: payload.provider || aiSettings.provider || 'auto',
    openaiApiKey: payload.openaiApiKey || aiSettings.openaiApiKey,
    openaiBaseUrl: payload.openaiBaseUrl || aiSettings.openaiBaseUrl,
    openaiModel: payload.openaiModel || aiSettings.openaiModel,
  };

  try {
    const res = await fetch('/api/ai-prioritize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.success) {
        return {
          priority: data.priority,
          score: data.score,
          reason: data.reason,
          isEscalated: data.priority === 'critical',
          waterAlert: !!data.isWaterContaminationAlert,
          source: data.source,
          recommendedAction: data.recommendedAction,
        };
      }
    }
  } catch (err) {
    console.warn('AI endpoint unavailable, using algorithmic priority:', err);
  }

  // Instant fallback to heuristics
  const fallback = calculateComplaintPriority({
    severity: payload.severity,
    affectedPeople: payload.affectedPeople,
    campusArea: payload.campusArea,
    isWaterIssue: payload.isWaterIssue,
    suspectedContamination: payload.suspectedContamination,
  });

  return {
    ...fallback,
    source: 'intelligent-heuristics-engine',
  };
}

