import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Zap,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Play,
  Settings2,
  ExternalLink
} from 'lucide-react';
import { AIProvider, AISettingsConfig } from '../../types';
import {
  getStoredAISettings,
  saveStoredAISettings,
  testAIConnection,
  fetchAIPrioritization
} from '../../utils/prioritization';
import { PriorityBadge } from './StatusBadge';
import { CampusFixIcon } from './CampusFixLogo';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState<AIProvider>('auto');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('https://api.openai.com/v1');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [showKey, setShowKey] = useState(false);

  // Connection Test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
    latencyMs?: number;
  } | null>(null);

  // Simulator state
  const [simTitle, setSimTitle] = useState('Drinking Water Turbidity & Chemical Taste in Hostel 4');
  const [simSeverity, setSimSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('critical');
  const [simArea, setSimArea] = useState('Hostels & Residential Halls');
  const [simWater, setSimWater] = useState(true);
  const [simContam, setSimContam] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredAISettings();
      setProvider(stored.provider || 'auto');
      setOpenaiApiKey(stored.openaiApiKey || '');
      setOpenaiBaseUrl(stored.openaiBaseUrl || 'https://api.openai.com/v1');
      setOpenaiModel(stored.openaiModel || 'gpt-4o-mini');
      setTestResult(null);
      setSimResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testAIConnection({
      provider,
      openaiApiKey: openaiApiKey.trim() || undefined,
      openaiBaseUrl: openaiBaseUrl.trim() || undefined,
      openaiModel: openaiModel.trim() || undefined,
    });
    setTestResult(res);
    setTesting(false);
  };

  const handleSave = () => {
    saveStoredAISettings({
      provider,
      openaiApiKey: openaiApiKey.trim() || undefined,
      openaiBaseUrl: openaiBaseUrl.trim() || undefined,
      openaiModel: openaiModel.trim() || undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetchAIPrioritization({
        title: simTitle,
        description: 'Corridor water cooler is dispensing water with noticeable discoloration and strong chlorine odor.',
        category: 'Water Systems & Quality',
        campusArea: simArea,
        specificLocation: 'Hostel 4, 1st Floor Wing B',
        severity: simSeverity,
        affectedPeople: 120,
        isWaterIssue: simWater,
        suspectedContamination: simContam,
        provider,
        openaiApiKey: openaiApiKey.trim() || undefined,
        openaiBaseUrl: openaiBaseUrl.trim() || undefined,
        openaiModel: openaiModel.trim() || undefined,
      });
      setSimResult(res);
    } catch (err: any) {
      setSimResult({
        priority: 'critical',
        score: 95,
        reason: 'Error connecting to provider: ' + err.message,
        source: 'fallback',
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 text-slate-900">
          <div className="flex items-center gap-3">
            <CampusFixIcon sizePx={32} />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">AI Prioritization Engine Configuration</h2>
              <p className="text-xs text-slate-500">
                Configure OpenAI API, Google Gemini, or intelligent campus heuristics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Primary AI Prioritization Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* OpenAI Option */}
              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  provider === 'openai'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-indigo-600" />
                      OpenAI API
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-1.5 py-0.5 rounded">
                      Free / Custom Key
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    GPT-4o-mini or free compatible endpoints (OpenRouter, Groq).
                  </p>
                </div>
              </button>

              {/* Gemini Option */}
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  provider === 'gemini'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-sky-600" />
                      Google Gemini
                    </span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-1.5 py-0.5 rounded">
                      Standard
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gemini 3.8 Flash model with institutional safety grounding.
                  </p>
                </div>
              </button>

              {/* Auto / Heuristics Option */}
              <button
                type="button"
                onClick={() => setProvider('auto')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  provider === 'auto'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-slate-600" />
                      Auto / Fallback
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                      Zero Downtime
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Attempts OpenAI/Gemini, smoothly falls back to campus rules.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* OpenAI Configuration Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                OpenAI API Credentials & Endpoint
              </span>
              <span className="text-[11px] text-slate-500">Supports OpenAI & Free-tier Proxies</span>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                OpenAI API Key (or Free Endpoint Key)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-... (or leave blank to use server environment variable)"
                  className="w-full px-3 py-2 pr-16 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-2 px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-800 bg-slate-100 rounded"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Keys remain in your local browser session and backend proxy without leaking to frontend source code.
              </p>
            </div>

            {/* Base URL and Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={openaiBaseUrl}
                  onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setOpenaiBaseUrl('https://api.openai.com/v1')}
                    className="text-[10px] text-indigo-600 hover:underline"
                  >
                    OpenAI Default
                  </button>
                  <span className="text-[10px] text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setOpenaiBaseUrl('https://openrouter.ai/api/v1')}
                    className="text-[10px] text-indigo-600 hover:underline"
                  >
                    OpenRouter Free
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setOpenaiModel('gpt-4o-mini')}
                    className="text-[10px] text-indigo-600 hover:underline"
                  >
                    gpt-4o-mini
                  </button>
                  <span className="text-[10px] text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setOpenaiModel('gpt-3.5-turbo')}
                    className="text-[10px] text-indigo-600 hover:underline"
                  >
                    gpt-3.5-turbo
                  </button>
                </div>
              </div>
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Testing API Latency...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-indigo-200" />
                    Test AI Connection
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`text-xs flex items-center gap-1.5 px-3 py-1 rounded-lg ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {testResult.message}
                    {testResult.latencyMs ? ` (${testResult.latencyMs}ms)` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Prioritization Live Simulator */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Live Incident Prioritization Simulator
              </span>
              <span className="text-[11px] text-slate-500">Test how the active AI ranks tickets</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Scenario Title</label>
                <input
                  type="text"
                  value={simTitle}
                  onChange={(e) => setSimTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Campus Area</label>
                <select
                  value={simArea}
                  onChange={(e) => setSimArea(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Hostels & Residential Halls">Hostels & Residential Halls</option>
                  <option value="Laboratories & Research Wings">Laboratories & Research Wings</option>
                  <option value="Campus Washrooms & Restrooms">Campus Washrooms & Restrooms</option>
                  <option value="Classrooms & Lecture Theatres">Classrooms & Lecture Theatres</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4 text-xs text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simContam}
                    onChange={(e) => setSimContam(e.target.checked)}
                    className="accent-indigo-600"
                  />
                  <span>Suspected Contamination</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={simulating}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
              >
                {simulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Computing...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Simulate Live Prioritization
                  </>
                )}
              </button>
            </div>

            {simResult && (
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5 mt-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Assigned Priority:</span>
                    <PriorityBadge priority={simResult.priority} score={simResult.score} />
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    Provider: {simResult.source}
                  </span>
                </div>
                <div className="text-slate-600">
                  <strong>AI Rationale:</strong> {simResult.reason}
                </div>
                {simResult.recommendedAction && (
                  <div className="text-indigo-900 text-[11px] font-medium bg-indigo-50 p-2 rounded border border-indigo-100">
                    💡 <strong>Operational Action:</strong> {simResult.recommendedAction}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {savedSuccess ? '✅ Settings saved successfully!' : 'Settings persist across student and staff sessions.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save AI Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
