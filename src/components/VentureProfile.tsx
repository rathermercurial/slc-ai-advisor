/**
 * VentureProfile Component
 *
 * Compact display of all 7 venture dimensions.
 * Typography-based design - no pills, consistent interaction.
 * Each dimension shows selected items; click + to expand options.
 */

import { useState, useCallback } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { VentureStage } from '../types/venture';

interface VentureProfileProps {
  canvasId: string;
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

const IMPACT_AREAS = [
  'Agriculture & Food',
  'Biodiversity',
  'Climate',
  'Clean Energy',
  'Community Development',
  'Ecosystems',
  'Education',
  'Employment',
  'Financial Inclusion',
  'Gender Equality',
  'Health',
  'Housing',
  'Land Conservation',
  'Oceans',
  'Peace & Justice',
  'Pollution Prevention',
  'Poverty Alleviation',
  'Racial Equity',
  'Waste Management',
  'Water Resources',
  'Workforce Development',
  'Youth Development',
];

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

const FUNDING_SOURCES = [
  'Bootstrapped',
  'Grants',
  'Crowdfunding',
  'Angel Investors',
  'Impact Investors',
  'Venture Capital',
  'Debt Financing',
];

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

// Expandable dimension component
interface DimensionRowProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
}

function DimensionRow({ label, options, selected, onToggle }: DimensionRowProps) {
  const [expanded, setExpanded] = useState(false);

  const displayText = selected.length > 0
    ? selected.join(', ')
    : <span className="profile-dim-empty">None selected</span>;

  return (
    <div className="profile-dim">
      <div className="profile-dim-header">
        <span className="profile-dim-label">{label}</span>
        <button
          type="button"
          className="profile-dim-toggle"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse options' : 'Expand options'}
          aria-expanded={expanded}
        >
          {expanded ? <Minus size={14} /> : <Plus size={14} />}
        </button>
      </div>
      <div className="profile-dim-value">{displayText}</div>
      {expanded && (
        <div className="profile-dim-options">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              className={`profile-dim-option ${selected.includes(opt) ? 'selected' : ''}`}
              onClick={() => onToggle(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function VentureProfile({ canvasId, onClose }: VentureProfileProps) {
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

  // Single-select handlers
  const handleStageToggle = useCallback((value: string) => {
    const newStage = value as VentureStage;
    setStage(newStage);
    saveDimension(canvasId, 'stage', newStage);
  }, [canvasId]);

  const handleLegalToggle = useCallback((value: string) => {
    const newValue = legalStructure === value ? '' : value;
    setLegalStructure(newValue);
    saveDimension(canvasId, 'legalStructure', newValue);
  }, [canvasId, legalStructure]);

  // Multi-select toggle helper
  const createArrayToggle = useCallback((
    arr: string[],
    setter: (v: string[]) => void,
    key: string
  ) => (item: string) => {
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

      <div className="profile-dims">
        {/* Row 1: Stage + Legal Structure */}
        <div className="profile-dims-row">
          <DimensionRow
            label="Stage"
            options={STAGES.map(s => s.label)}
            selected={[STAGES.find(s => s.value === stage)?.label || 'Idea']}
            onToggle={(label) => {
              const found = STAGES.find(s => s.label === label);
              if (found) handleStageToggle(found.value);
            }}
          />
          <DimensionRow
            label="Legal Structure"
            options={LEGAL_STRUCTURES}
            selected={legalStructure ? [legalStructure] : []}
            onToggle={handleLegalToggle}
          />
        </div>

        {/* Row 2: Impact Areas + Mechanisms */}
        <div className="profile-dims-row">
          <DimensionRow
            label="Impact Areas"
            options={IMPACT_AREAS}
            selected={impactAreas}
            onToggle={createArrayToggle(impactAreas, setImpactAreas, 'impactAreas')}
          />
          <DimensionRow
            label="Mechanisms"
            options={IMPACT_MECHANISMS}
            selected={impactMechanisms}
            onToggle={createArrayToggle(impactMechanisms, setImpactMechanisms, 'impactMechanisms')}
          />
        </div>

        {/* Row 3: Revenue + Funding */}
        <div className="profile-dims-row">
          <DimensionRow
            label="Revenue"
            options={REVENUE_SOURCES}
            selected={revenueSources}
            onToggle={createArrayToggle(revenueSources, setRevenueSources, 'revenueSources')}
          />
          <DimensionRow
            label="Funding"
            options={FUNDING_SOURCES}
            selected={fundingSources}
            onToggle={createArrayToggle(fundingSources, setFundingSources, 'fundingSources')}
          />
        </div>

        {/* Row 4: Industries */}
        <DimensionRow
          label="Industries"
          options={INDUSTRIES}
          selected={industries}
          onToggle={createArrayToggle(industries, setIndustries, 'industries')}
        />
      </div>
    </div>
  );
}
