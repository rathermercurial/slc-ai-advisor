import { useState, useEffect, useCallback, useRef } from 'react';
import { CanvasSection } from './CanvasSection';
import { CanvasSkeleton } from './CanvasSkeleton';
import { ImpactModelInline } from './ImpactModelInline';
import {
  type CanvasSectionId,
  type ImpactModel,
  type Model,
  createEmptySections,
  createEmptyImpactModel,
  SECTION_TO_MODEL,
} from '../types/canvas';
import { useCanvasContext } from '../context';

interface CanvasProps {
  canvasId: string;
  /** Current hovered model for highlighting */
  hoveredModel?: string | null;
  /** Callback when hovered model changes */
  onHoveredModelChange?: (model: string | null) => void;
}

/**
 * Helper text shown when a section is empty.
 * Based on the official Social Lean Canvas.
 */
const SECTION_HELPER_TEXT: Record<CanvasSectionId, string> = {
  purpose:
    'Your reason for doing this venture, clearly defined in terms of the social or environmental problems you want to solve.',
  impact:
    'What is the intended social or environmental impact of your venture?',
  jobsToBeDone:
    'What are the specific problems and jobs each of the different customer types face?',
  solution: 'What is your product or service?',
  valueProposition:
    'What is the unique combination of benefits your product or service will offer to overcome problems the customer has?',
  advantage: 'Why will this venture succeed ahead of the competition?',
  customers:
    'Who do you need to move to make your business model work?',
  keyMetrics:
    'What are the numbers that will show your business model is working?',
  channels: 'How will you reach your customers in a scalable way?',
  costs:
    'What are the major costs associated with running this social enterprise?',
  revenue:
    'What are the ongoing flows of income that will create financial sustainability for this venture?',
};

/**
 * The Social Lean Canvas with official layout.
 * Layout matches socialleancanvas.com
 *
 * Uses CanvasContext for real-time sync with agent updates.
 * Maintains local state for sections being edited to prevent
 * remote updates from disrupting user input.
 */
export function Canvas({ canvasId, hoveredModel: externalHoveredModel, onHoveredModelChange }: CanvasProps) {
  // Get synced state from context (updated by Chat via agent state sync)
  const {
    canvas: syncedCanvas,
    editingSections,
    setEditing,
    saveSection,
    saveImpactModel,
  } = useCanvasContext();

  // Local state for immediate UI updates
  const [localSections, setLocalSections] = useState<Record<CanvasSectionId, string>>(() =>
    createEmptySections(canvasId).reduce(
      (acc, section) => {
        acc[section.sectionKey] = section.content;
        return acc;
      },
      {} as Record<CanvasSectionId, string>
    )
  );

  const [localImpactModel, setLocalImpactModel] = useState<ImpactModel>(() =>
    createEmptyImpactModel(canvasId)
  );

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Track recently updated sections for visual feedback
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<CanvasSectionId>>(new Set());
  const prevSyncedRef = useRef<string | null>(null);

  // Impact Model expanded/collapsed state (collapsed by default)
  const [impactExpanded, setImpactExpanded] = useState(() => {
    const saved = localStorage.getItem('impactModelExpanded');
    return saved === 'true';
  });

  // Track if Impact Model was just opened (for auto-focus)
  const [impactJustOpened, setImpactJustOpened] = useState(false);

  // Track which model is being hovered for sibling highlighting
  // Use external state if provided, otherwise use local state
  const [localHoveredModel, setLocalHoveredModel] = useState<Model | null>(null);
  const hoveredModel = externalHoveredModel !== undefined ? externalHoveredModel as Model | null : localHoveredModel;
  const setHoveredModel = onHoveredModelChange || setLocalHoveredModel;

  // Tab navigation between sections
  const [forceEditSection, setForceEditSection] = useState<CanvasSectionId | null>(null);

  // Define tab order for sections (matches section numbers 1-11)
  const TAB_ORDER: CanvasSectionId[] = [
    'purpose',       // 1
    'customers',     // 2
    'jobsToBeDone',  // 3
    'valueProposition', // 4
    'solution',      // 5
    'channels',      // 6
    'revenue',       // 7
    'costs',         // 8
    'keyMetrics',    // 9
    'advantage',     // 10
    'impact',        // 11
  ];

  const handleTabNext = useCallback((currentSection: CanvasSectionId) => {
    const currentIndex = TAB_ORDER.indexOf(currentSection);
    if (currentIndex >= 0 && currentIndex < TAB_ORDER.length - 1) {
      setForceEditSection(TAB_ORDER[currentIndex + 1]);
    }
  }, []);

  const handleTabPrev = useCallback((currentSection: CanvasSectionId) => {
    const currentIndex = TAB_ORDER.indexOf(currentSection);
    if (currentIndex > 0) {
      setForceEditSection(TAB_ORDER[currentIndex - 1]);
    }
  }, []);

  // Clear forceEdit after it's been processed
  useEffect(() => {
    if (forceEditSection) {
      const timer = setTimeout(() => setForceEditSection(null), 100);
      return () => clearTimeout(timer);
    }
  }, [forceEditSection]);

  const MODEL_LABELS: Record<Model, string> = {
    customer: 'Customer Model',
    economic: 'Economic Model',
    impact: 'Impact Model',
  };

  // Initial load from backend (fallback if agent hasn't synced yet)
  useEffect(() => {
    async function loadCanvas() {
    // DEV MODE: Use empty canvas without backend
    if (import.meta.env.VITE_FRONTEND_ONLY === 'true') {
      setIsLoading(false);
      return;
    }
    // 

      try {
        const response = await fetch(`/api/canvas/${canvasId}`);
        if (response.ok) {
          const data = await response.json();

          // Update sections from backend
          if (data.sections) {
            const sectionsMap: Record<CanvasSectionId, string> = {} as Record<CanvasSectionId, string>;
            for (const section of data.sections) {
              sectionsMap[section.sectionKey as CanvasSectionId] = section.content || '';
            }
            setLocalSections(sectionsMap);
          }

          // Update impact model from backend
          if (data.impactModel) {
            setLocalImpactModel(data.impactModel);
          }
        } else {
          setLoadError('Failed to load canvas data');
        }
      } catch (err) {
        console.error('Failed to load canvas:', err);
        setLoadError('Network error loading canvas');
      } finally {
        setIsLoading(false);
      }
    }

    loadCanvas();
  }, [canvasId]);

  // Merge synced canvas with local state
  // Only update sections that are NOT being edited locally
  useEffect(() => {
    if (!syncedCanvas || syncedCanvas.updatedAt === prevSyncedRef.current) return;

    prevSyncedRef.current = syncedCanvas.updatedAt;

    // Find which sections changed
    const updatedSectionKeys = new Set<CanvasSectionId>();

    setLocalSections(prev => {
      const merged = { ...prev };
      for (const section of syncedCanvas.sections) {
        const key = section.sectionKey as CanvasSectionId;
        // Only update if not being edited AND content actually changed
        if (!editingSections.has(key) && prev[key] !== section.content) {
          merged[key] = section.content;
          updatedSectionKeys.add(key);
        }
      }
      return merged;
    });

    // Update impact model if not being edited
    if (!editingSections.has('impact')) {
      setLocalImpactModel(syncedCanvas.impactModel);
    }

    // Mark updated sections for visual feedback
    if (updatedSectionKeys.size > 0) {
      setRecentlyUpdated(updatedSectionKeys);
      // Clear after animation
      setTimeout(() => setRecentlyUpdated(new Set()), 1500);
    }
  }, [syncedCanvas, editingSections]);

  const handleSectionSave = useCallback(async (sectionKey: CanvasSectionId, content: string) => {
    // Persist via context - returns success/failure
    const result = await saveSection(sectionKey, content, canvasId);

    if (result.success) {
      // Update local state only on successful save
      setLocalSections((prev) => ({
        ...prev,
        [sectionKey]: content,
      }));
      // Clear editing state
      setEditing(sectionKey, false);
    }

    return result;
  }, [canvasId, saveSection, setEditing]);

  const handleSectionFocus = useCallback((sectionKey: CanvasSectionId) => {
    setEditing(sectionKey, true);
  }, [setEditing]);

  const handleImpactSave = useCallback(async (updatedImpact: ImpactModel) => {
    // Update local state immediately for responsiveness
    setLocalImpactModel(updatedImpact);

    // Clear editing state
    setEditing('impact', false);

    // Persist via context
    await saveImpactModel(updatedImpact, canvasId);
  }, [canvasId, saveImpactModel, setEditing]);

  // Toggle Impact Model expansion
  const handleImpactToggle = useCallback(() => {
    setImpactExpanded((prev) => {
      const next = !prev;
      localStorage.setItem('impactModelExpanded', String(next));
      if (next) {
        // Opening - set flag to auto-focus first field
        setImpactJustOpened(true);
      }
      return next;
    });
  }, []);

  // Clear impactJustOpened after it's been used
  useEffect(() => {
    if (impactJustOpened) {
      const timer = setTimeout(() => setImpactJustOpened(false), 100);
      return () => clearTimeout(timer);
    }
  }, [impactJustOpened]);

  // Track section hover for model highlighting
  const handleSectionMouseEnter = useCallback((sectionKey: CanvasSectionId) => {
    const model = SECTION_TO_MODEL[sectionKey];
    if (model) {
      setHoveredModel(model);
    }
  }, []);

  const handleSectionMouseLeave = useCallback(() => {
    setHoveredModel(null);
  }, []);

  // Show loading skeleton or error state
  if (isLoading) {
    return <CanvasSkeleton />;
  }

  if (loadError) {
    return (
      <div className="slc-canvas canvas-error-container">
        <div className="canvas-error">
          <p>{loadError}</p>
          <button type="button" className="canvas-error-retry" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`slc-canvas ${hoveredModel ? `hover-${hoveredModel}` : ''}`}>
        {/* Top Row: Purpose + Impact Summary */}
        <div className="slc-row slc-row-top">
          <CanvasSection
            sectionKey="purpose"
            content={localSections.purpose || ''}
            onSave={(content) => handleSectionSave('purpose', content)}
            onFocus={() => handleSectionFocus('purpose')}
            onMouseEnter={() => handleSectionMouseEnter('purpose')}
            onMouseLeave={handleSectionMouseLeave}
            helperText={SECTION_HELPER_TEXT.purpose}
            isUpdating={recentlyUpdated.has('purpose')}
            onTabNext={() => handleTabNext('purpose')}
            onTabPrev={() => handleTabPrev('purpose')}
            forceEdit={forceEditSection === 'purpose'}
          />
          <CanvasSection
            sectionKey="impact"
            content={localImpactModel.impact || ''}
            onSave={async () => ({ success: true })}
            onClick={handleImpactToggle}
            onMouseEnter={() => handleSectionMouseEnter('impact')}
            onMouseLeave={handleSectionMouseLeave}
            helperText={SECTION_HELPER_TEXT.impact}
            isUpdating={recentlyUpdated.has('impact')}
            readOnly
            className={impactExpanded ? 'impact-expanded' : ''}
            onTabNext={() => handleTabNext('impact')}
            onTabPrev={() => handleTabPrev('impact')}
          />
        </div>

        {/* Middle Section: 5-column layout with varying heights */}
        <div className="slc-row slc-row-middle">
          {/* Column 1: Jobs To Be Done (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="jobsToBeDone"
              content={localSections.jobsToBeDone || ''}
              onSave={(content) => handleSectionSave('jobsToBeDone', content)}
              onFocus={() => handleSectionFocus('jobsToBeDone')}
              onMouseEnter={() => handleSectionMouseEnter('jobsToBeDone')}
              onMouseLeave={handleSectionMouseLeave}
              helperText={SECTION_HELPER_TEXT.jobsToBeDone}
              isUpdating={recentlyUpdated.has('jobsToBeDone')}
              onTabNext={() => handleTabNext('jobsToBeDone')}
              onTabPrev={() => handleTabPrev('jobsToBeDone')}
              forceEdit={forceEditSection === 'jobsToBeDone'}
            />
          </div>

          {/* Column 2: Solution + Key Metrics (stacked) */}
          <div className="slc-col slc-col-stacked">
            <CanvasSection
              sectionKey="solution"
              content={localSections.solution || ''}
              onSave={(content) => handleSectionSave('solution', content)}
              onFocus={() => handleSectionFocus('solution')}
              onMouseEnter={() => handleSectionMouseEnter('solution')}
              onMouseLeave={handleSectionMouseLeave}
              helperText={SECTION_HELPER_TEXT.solution}
              isUpdating={recentlyUpdated.has('solution')}
              onTabNext={() => handleTabNext('solution')}
              onTabPrev={() => handleTabPrev('solution')}
              forceEdit={forceEditSection === 'solution'}
            />
            <CanvasSection
              sectionKey="keyMetrics"
              content={localSections.keyMetrics || ''}
              onSave={(content) => handleSectionSave('keyMetrics', content)}
              onFocus={() => handleSectionFocus('keyMetrics')}
              onMouseEnter={() => handleSectionMouseEnter('keyMetrics')}
              onMouseLeave={handleSectionMouseLeave}
              helperText={SECTION_HELPER_TEXT.keyMetrics}
              isUpdating={recentlyUpdated.has('keyMetrics')}
              onTabNext={() => handleTabNext('keyMetrics')}
              onTabPrev={() => handleTabPrev('keyMetrics')}
              forceEdit={forceEditSection === 'keyMetrics'}
            />
          </div>

          {/* Column 3: Value Proposition (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="valueProposition"
              content={localSections.valueProposition || ''}
              onSave={(content) => handleSectionSave('valueProposition', content)}
              onFocus={() => handleSectionFocus('valueProposition')}
              onMouseEnter={() => handleSectionMouseEnter('valueProposition')}
              onMouseLeave={handleSectionMouseLeave}
              helperText={SECTION_HELPER_TEXT.valueProposition}
              isUpdating={recentlyUpdated.has('valueProposition')}
              onTabNext={() => handleTabNext('valueProposition')}
              onTabPrev={() => handleTabPrev('valueProposition')}
              forceEdit={forceEditSection === 'valueProposition'}
            />
          </div>

          {/* Column 4: Advantage + Channels (stacked) */}
          <div className="slc-col slc-col-stacked">
            <CanvasSection
              sectionKey="advantage"
              content={localSections.advantage || ''}
              onSave={(content) => handleSectionSave('advantage', content)}
              onFocus={() => handleSectionFocus('advantage')}
              onMouseEnter={() => handleSectionMouseEnter('advantage')}
              onMouseLeave={handleSectionMouseLeave}
              helperText={SECTION_HELPER_TEXT.advantage}
              isUpdating={recentlyUpdated.has('advantage')}
              onTabNext={() => handleTabNext('advantage')}
              onTabPrev={() => handleTabPrev('advantage')}
              forceEdit={forceEditSection === 'advantage'}
            />
            <CanvasSection
              sectionKey="channels"
              content={localSections.channels || ''}
              onSave={(content) => handleSectionSave('channels', content)}
              onFocus={() => handleSectionFocus('channels')}
              onMouseEnter={() => handleSectionMouseEnter('channels')}
              onMouseLeave={handleSectionMouseLeave}
              helperText={SECTION_HELPER_TEXT.channels}
              isUpdating={recentlyUpdated.has('channels')}
              onTabNext={() => handleTabNext('channels')}
              onTabPrev={() => handleTabPrev('channels')}
              forceEdit={forceEditSection === 'channels'}
            />
          </div>

          {/* Column 5: Customers (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="customers"
              content={localSections.customers || ''}
              onSave={(content) => handleSectionSave('customers', content)}
              onFocus={() => handleSectionFocus('customers')}
              onMouseEnter={() => handleSectionMouseEnter('customers')}
              onMouseLeave={handleSectionMouseLeave}
              helperText={SECTION_HELPER_TEXT.customers}
              isUpdating={recentlyUpdated.has('customers')}
              onTabNext={() => handleTabNext('customers')}
              onTabPrev={() => handleTabPrev('customers')}
              forceEdit={forceEditSection === 'customers'}
            />
          </div>
        </div>

        {/* Bottom Row: Costs & Revenue */}
        <div className="slc-row slc-row-bottom">
          <CanvasSection
            sectionKey="costs"
            content={localSections.costs || ''}
            onSave={(content) => handleSectionSave('costs', content)}
            onFocus={() => handleSectionFocus('costs')}
            onMouseEnter={() => handleSectionMouseEnter('costs')}
            onMouseLeave={handleSectionMouseLeave}
            helperText={SECTION_HELPER_TEXT.costs}
            isUpdating={recentlyUpdated.has('costs')}
            onTabNext={() => handleTabNext('costs')}
            onTabPrev={() => handleTabPrev('costs')}
            forceEdit={forceEditSection === 'costs'}
          />
          <CanvasSection
            sectionKey="revenue"
            content={localSections.revenue || ''}
            onSave={(content) => handleSectionSave('revenue', content)}
            onFocus={() => handleSectionFocus('revenue')}
            onMouseEnter={() => handleSectionMouseEnter('revenue')}
            onMouseLeave={handleSectionMouseLeave}
            helperText={SECTION_HELPER_TEXT.revenue}
            isUpdating={recentlyUpdated.has('revenue')}
            onTabNext={() => handleTabNext('revenue')}
            onTabPrev={() => handleTabPrev('revenue')}
            forceEdit={forceEditSection === 'revenue'}
          />
        </div>
      </div>

      {/* Model indicator moved to VentureHeader when external state is used */}
      {!onHoveredModelChange && (
        <div className={`model-indicator ${hoveredModel ? `visible ${hoveredModel}` : ''}`}>
          {hoveredModel ? MODEL_LABELS[hoveredModel] : ''}
        </div>
      )}

      {/* Impact Model - Collapsible 2x4 grid below canvas */}
      {impactExpanded && (
        <ImpactModelInline
          impactModel={localImpactModel}
          onSave={handleImpactSave}
          isUpdating={recentlyUpdated.has('impact')}
          isHighlighted={hoveredModel === 'impact'}
          autoFocusFirst={impactJustOpened}
        />
      )}
    </>
  );
}
