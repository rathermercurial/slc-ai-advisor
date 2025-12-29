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

// 11 legal structures
const LEGAL_STRUCTURES = [
  'Nonprofit 501(c)(3)',
  'For-profit C-Corp',
  'For-profit LLC',
  'B Corporation',
  'Benefit Corporation',
  'Cooperative',
  'CIC',
  'Social Enterprise',
  'L3C',
  'Fiscal Sponsorship',
  'Hybrid',
];

// 34 impact areas: 17 SDGs + 17 IRIS+ themes
const IMPACT_AREAS = [
  // UN SDGs
  'No Poverty',
  'Zero Hunger',
  'Good Health',
  'Quality Education',
  'Gender Equality',
  'Clean Water',
  'Clean Energy',
  'Decent Work',
  'Industry & Innovation',
  'Reduced Inequalities',
  'Sustainable Cities',
  'Responsible Consumption',
  'Climate Action',
  'Life Below Water',
  'Life on Land',
  'Peace & Justice',
  'Partnerships',
  // IRIS+ themes
  'Agriculture',
  'Biodiversity',
  'Ecosystems',
  'Employment',
  'Financial Inclusion',
  'Food Security',
  'Housing',
  'Land Conservation',
  'Oceans',
  'Pollution Prevention',
  'Racial Equity',
  'Real Estate',
  'Supply Chain',
  'Waste Management',
  'Water Resources',
  'Workforce Development',
  'Youth Development',
];

// 10 impact mechanisms
const IMPACT_MECHANISMS = [
  'Direct Service',
  'Product-based',
  'Employment Model',
  'Behavior Change',
  'Market Transformation',
  'Policy Advocacy',
  'Technology Platform',
  'Capacity Building',
  'Research & Development',
  'Systems Change',
];

// 11 revenue sources
const REVENUE_SOURCES = [
  'Product Sales',
  'Service Fees',
  'Subscriptions',
  'Licensing',
  'Grants',
  'Donations',
  'Membership Fees',
  'Advertising',
  'Transaction Fees',
  'Government Contracts',
  'Interest & Dividends',
];

// 7 funding sources
const FUNDING_SOURCES = [
  'Bootstrapped',
  'Grants',
  'Crowdfunding',
  'Angel Investors',
  'Impact Investors',
  'Venture Capital',
  'Debt Financing',
];

// 17 industries
const INDUSTRIES = [
  'Healthcare',
  'Education',
  'Agriculture & Food',
  'Technology',
  'Financial Services',
  'Energy',
  'Transportation',
  'Housing & Real Estate',
  'Retail & Consumer',
  'Manufacturing',
  'Media & Entertainment',
  'Professional Services',
  'Environment & Conservation',
  'Arts & Culture',
  'Community Development',
  'Legal Services',
  'Workforce Development',
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
