/**
 * VentureProfile Component
 *
 * Compact display of all 7 venture dimensions.
 * Typography-based design - no pills, consistent interaction.
 * Each dimension shows selected items; click + to expand options.
 *
 * Data is persisted to backend via /api/canvas/:id/venture-profile
 */

import { useState, useCallback, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { VentureStage, VentureProperties } from '../types/venture';

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
  'B Corporation',
  'Benefit Corporation',
  'CIC',
  'Cooperative',
  'Fiscal Sponsorship',
  'For-profit C-Corp',
  'For-profit LLC',
  'Hybrid',
  'L3C',
  'Nonprofit 501(c)(3)',
  'Social Enterprise',
];

const IMPACT_AREAS = [
  'Agriculture & Food',
  'Biodiversity',
  'Clean Energy',
  'Climate',
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
  'Behavior Change',
  'Capacity Building',
  'Direct Service',
  'Employment Model',
  'Market Transformation',
  'Policy Advocacy',
  'Product-based',
  'Research & Development',
  'Systems Change',
  'Technology Platform',
];

const REVENUE_SOURCES = [
  'Advertising',
  'Donations',
  'Government Contracts',
  'Grants',
  'Interest & Dividends',
  'Licensing',
  'Membership Fees',
  'Product Sales',
  'Service Fees',
  'Subscriptions',
  'Transaction Fees',
];

const FUNDING_SOURCES = [
  'Angel Investors',
  'Bootstrapped',
  'Crowdfunding',
  'Debt Financing',
  'Grants',
  'Impact Investors',
  'Venture Capital',
];

const INDUSTRIES = [
  'Agriculture & Food',
  'Arts & Culture',
  'Community Development',
  'Education',
  'Energy',
  'Environment & Conservation',
  'Financial Services',
  'Healthcare',
  'Housing & Real Estate',
  'Legal Services',
  'Manufacturing',
  'Media & Entertainment',
  'Professional Services',
  'Retail & Consumer',
  'Technology',
  'Transportation',
  'Workforce Development',
];

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
      <button
        type="button"
        className="profile-dim-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded ? 'true' : 'false'}
      >
        <span className="profile-dim-label">{label}</span>
        <span className="profile-dim-toggle">
          {expanded ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <div className="profile-dim-value" onClick={() => setExpanded(!expanded)}>{displayText}</div>
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
  // State for all dimensions - loaded from backend
  const [stage, setStage] = useState<VentureStage | null>(null);
  const [legalStructure, setLegalStructure] = useState<string | null>(null);
  const [impactAreas, setImpactAreas] = useState<string[]>([]);
  const [impactMechanisms, setImpactMechanisms] = useState<string[]>([]);
  const [revenueSources, setRevenueSources] = useState<string[]>([]);
  const [fundingSources, setFundingSources] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load venture profile from backend on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(`/api/canvas/${canvasId}/venture-profile`);
        if (response.ok) {
          const data = await response.json() as { properties: VentureProperties };
          const props = data.properties;
          setStage(props.ventureStage as VentureStage | null);
          setLegalStructure(props.legalStructure);
          setImpactAreas(props.impactAreas || []);
          setImpactMechanisms(props.impactMechanisms || []);
          setRevenueSources(props.revenueSources || []);
          setFundingSources(props.fundingSources || []);
          setIndustries(props.industries || []);
        }
      } catch (err) {
        console.error('Failed to load venture profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [canvasId]);

  // Save property to backend
  const saveProperty = useCallback(async (
    property: keyof VentureProperties,
    value: string | string[] | null
  ) => {
    try {
      await fetch(`/api/canvas/${canvasId}/venture-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property, value, confirmed: true }),
      });
    } catch (err) {
      console.error(`Failed to save ${property}:`, err);
    }
  }, [canvasId]);

  // Stage is single-select
  const handleStageToggle = useCallback((label: string) => {
    const found = STAGES.find(s => s.label === label);
    if (found) {
      setStage(found.value);
      saveProperty('ventureStage', found.value);
    }
  }, [saveProperty]);

  // Legal structure is single-select
  const handleLegalToggle = useCallback((value: string) => {
    const newValue = legalStructure === value ? null : value;
    setLegalStructure(newValue);
    saveProperty('legalStructure', newValue);
  }, [legalStructure, saveProperty]);

  // Multi-select toggle helper
  const createArrayToggle = useCallback((
    arr: string[],
    setter: (v: string[]) => void,
    property: keyof VentureProperties
  ) => (item: string) => {
    const newArr = arr.includes(item)
      ? arr.filter(i => i !== item)
      : [...arr, item];
    setter(newArr);
    saveProperty(property, newArr);
  }, [saveProperty]);

  if (isLoading) {
    return (
      <div className="profile-inline">
        <div className="profile-inline-header">
          <span className="profile-inline-title">Venture Profile</span>
          <button
            type="button"
            className="profile-inline-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="profile-dims" style={{ padding: '1rem', opacity: 0.6 }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-inline">
      <div className="profile-inline-header">
        <span className="profile-inline-title">Venture Profile</span>
        <button
          type="button"
          className="profile-inline-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="profile-dims">
        {/* Row 1: Stage, Legal, Impact Areas, Mechanisms */}
        <div className="profile-dims-row">
          <DimensionRow
            label="Stage"
            options={STAGES.map(s => s.label)}
            selected={stage ? [STAGES.find(s => s.value === stage)?.label || ''] : []}
            onToggle={handleStageToggle}
          />
          <DimensionRow
            label="Legal Structure"
            options={LEGAL_STRUCTURES}
            selected={legalStructure ? [legalStructure] : []}
            onToggle={handleLegalToggle}
          />
          <DimensionRow
            label="Impact"
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

        {/* Row 2: Revenue, Funding, Industries */}
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
          <DimensionRow
            label="Industries"
            options={INDUSTRIES}
            selected={industries}
            onToggle={createArrayToggle(industries, setIndustries, 'industries')}
          />
        </div>
      </div>
    </div>
  );
}
