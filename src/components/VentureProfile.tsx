/**
 * VentureProfile Component
 *
 * Compact display of all 7 venture dimensions.
 * Clean, simple layout with dropdowns and multi-selects.
 */

import { useState, useCallback } from 'react';
import type { VentureStage } from '../types/venture';

interface VentureProfileProps {
  canvasId: string;
  progress: number;
  onClose: () => void;
}

// Dimension options
const STAGES: { value: VentureStage; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'validation', label: 'Validation' },
  { value: 'growth', label: 'Growth' },
  { value: 'scale', label: 'Scale' },
];

const LEGAL_STRUCTURES = [
  'Nonprofit',
  'For-profit',
  'B Corp',
  'Cooperative',
  'CIC',
  'Hybrid',
  'Fiscal sponsorship',
];

const IMPACT_AREAS = [
  'Health',
  'Education',
  'Environment',
  'Climate',
  'Poverty',
  'Food security',
  'Clean water',
  'Housing',
  'Employment',
  'Financial inclusion',
  'Gender equality',
  'Racial equity',
];

const IMPACT_MECHANISMS = [
  'Behavior change',
  'Market transformation',
  'Policy advocacy',
  'Direct service',
  'Technology platform',
  'Capacity building',
];

const REVENUE_SOURCES = [
  'Product sales',
  'Service fees',
  'Subscriptions',
  'Licensing',
  'Grants',
  'Donations',
  'Advertising',
];

const FUNDING_SOURCES = [
  'Bootstrapped',
  'Grants',
  'Crowdfunding',
  'Angel investors',
  'Impact investors',
  'Venture capital',
  'Debt financing',
];

const INDUSTRIES = [
  'Healthcare',
  'Education',
  'Agriculture',
  'Technology',
  'Financial services',
  'Energy',
  'Transportation',
  'Retail',
  'Manufacturing',
];

// Helper to load from localStorage
function loadDimension<T>(canvasId: string, key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(`venture-${key}-${canvasId}`);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.warn(`Failed to load ${key}:`, e);
  }
  return defaultValue;
}

// Helper to save to localStorage
function saveDimension<T>(canvasId: string, key: string, value: T): void {
  try {
    localStorage.setItem(`venture-${key}-${canvasId}`, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key}:`, e);
  }
}

export function VentureProfile({ canvasId, progress, onClose }: VentureProfileProps) {
  // Load all dimensions from localStorage
  const [stage, setStage] = useState<VentureStage>(() =>
    loadDimension(canvasId, 'stage', 'idea' as VentureStage)
  );
  const [legalStructure, setLegalStructure] = useState<string>(() =>
    loadDimension(canvasId, 'legalStructure', '')
  );
  const [impactAreas, setImpactAreas] = useState<string[]>(() =>
    loadDimension(canvasId, 'impactAreas', [])
  );
  const [impactMechanisms, setImpactMechanisms] = useState<string[]>(() =>
    loadDimension(canvasId, 'impactMechanisms', [])
  );
  const [revenueSources, setRevenueSources] = useState<string[]>(() =>
    loadDimension(canvasId, 'revenueSources', [])
  );
  const [fundingSources, setFundingSources] = useState<string[]>(() =>
    loadDimension(canvasId, 'fundingSources', [])
  );
  const [industries, setIndustries] = useState<string[]>(() =>
    loadDimension(canvasId, 'industries', [])
  );

  // Handlers
  const handleStageChange = useCallback((value: VentureStage) => {
    setStage(value);
    saveDimension(canvasId, 'stage', value);
  }, [canvasId]);

  const handleLegalChange = useCallback((value: string) => {
    setLegalStructure(value);
    saveDimension(canvasId, 'legalStructure', value);
  }, [canvasId]);

  const toggleArrayItem = useCallback((
    arr: string[],
    item: string,
    setter: (v: string[]) => void,
    key: string
  ) => {
    const newArr = arr.includes(item)
      ? arr.filter(i => i !== item)
      : [...arr, item];
    setter(newArr);
    saveDimension(canvasId, key, newArr);
  }, [canvasId]);

  return (
    <div className="profile-inline">
      <div className="profile-inline-header">
        <span className="profile-inline-title">Venture Profile</span>
        <button
          className="profile-inline-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="profile-grid">
        {/* Row 1: Stage + Legal + Progress */}
        <div className="profile-row">
          <div className="profile-field">
            <label className="profile-label">Stage</label>
            <select
              className="profile-select"
              value={stage}
              onChange={(e) => handleStageChange(e.target.value as VentureStage)}
            >
              {STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="profile-field">
            <label className="profile-label">Legal Structure</label>
            <select
              className="profile-select"
              value={legalStructure}
              onChange={(e) => handleLegalChange(e.target.value)}
            >
              <option value="">Select...</option>
              {LEGAL_STRUCTURES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="profile-field profile-field-progress">
            <label className="profile-label">Progress</label>
            <span className="profile-progress-value">{progress}%</span>
          </div>
        </div>

        {/* Row 2: Impact Areas */}
        <div className="profile-row">
          <div className="profile-field profile-field-wide">
            <label className="profile-label">Impact Areas</label>
            <div className="profile-chips">
              {IMPACT_AREAS.map(area => (
                <button
                  key={area}
                  type="button"
                  className={`profile-chip ${impactAreas.includes(area) ? 'selected' : ''}`}
                  onClick={() => toggleArrayItem(impactAreas, area, setImpactAreas, 'impactAreas')}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Impact Mechanisms */}
        <div className="profile-row">
          <div className="profile-field profile-field-wide">
            <label className="profile-label">Impact Mechanisms</label>
            <div className="profile-chips">
              {IMPACT_MECHANISMS.map(mech => (
                <button
                  key={mech}
                  type="button"
                  className={`profile-chip ${impactMechanisms.includes(mech) ? 'selected' : ''}`}
                  onClick={() => toggleArrayItem(impactMechanisms, mech, setImpactMechanisms, 'impactMechanisms')}
                >
                  {mech}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Revenue + Funding */}
        <div className="profile-row">
          <div className="profile-field">
            <label className="profile-label">Revenue Sources</label>
            <div className="profile-chips">
              {REVENUE_SOURCES.map(src => (
                <button
                  key={src}
                  type="button"
                  className={`profile-chip ${revenueSources.includes(src) ? 'selected' : ''}`}
                  onClick={() => toggleArrayItem(revenueSources, src, setRevenueSources, 'revenueSources')}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-field">
            <label className="profile-label">Funding Sources</label>
            <div className="profile-chips">
              {FUNDING_SOURCES.map(src => (
                <button
                  key={src}
                  type="button"
                  className={`profile-chip ${fundingSources.includes(src) ? 'selected' : ''}`}
                  onClick={() => toggleArrayItem(fundingSources, src, setFundingSources, 'fundingSources')}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 5: Industries */}
        <div className="profile-row">
          <div className="profile-field profile-field-wide">
            <label className="profile-label">Industries</label>
            <div className="profile-chips">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind}
                  type="button"
                  className={`profile-chip ${industries.includes(ind) ? 'selected' : ''}`}
                  onClick={() => toggleArrayItem(industries, ind, setIndustries, 'industries')}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
