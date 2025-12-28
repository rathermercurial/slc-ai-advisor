import { useState, useEffect, useCallback, useRef } from 'react';
import { CanvasSection } from './CanvasSection';
import { CanvasSkeleton } from './CanvasSkeleton';
import { ImpactModelInline } from './ImpactModelInline';
import {
  type CanvasSectionId,
  type ImpactModel,
  createEmptySections,
  createEmptyImpactModel,
} from '../types/canvas';
import { useCanvasContext } from '../context';

interface CanvasProps {
  canvasId: string;
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
export function Canvas({ canvasId }: CanvasProps) {
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
      return next;
    });
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
      <div className="slc-canvas">
        {/* Top Row: Purpose + Impact Summary */}
        <div className="slc-row slc-row-top">
          <CanvasSection
            sectionKey="purpose"
            content={localSections.purpose || ''}
            onSave={(content) => handleSectionSave('purpose', content)}
            onFocus={() => handleSectionFocus('purpose')}
            helperText={SECTION_HELPER_TEXT.purpose}
            isUpdating={recentlyUpdated.has('purpose')}
          />
          <CanvasSection
            sectionKey="impact"
            content={localImpactModel.impact || ''}
            onSave={async (content) => {
              const updated = { ...localImpactModel, impact: content };
              await handleImpactSave(updated);
              return { success: true };
            }}
            onFocus={() => setEditing('impact', true)}
            helperText={SECTION_HELPER_TEXT.impact}
            isUpdating={recentlyUpdated.has('impact')}
          />
          <button
            type="button"
            className={`impact-toggle-btn ${impactExpanded ? 'expanded' : ''}`}
            onClick={handleImpactToggle}
            title={impactExpanded ? 'Collapse Impact Model' : 'Expand Impact Model'}
            aria-expanded={impactExpanded}
          >
            {impactExpanded ? '▲' : '▼'}
          </button>
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
              helperText={SECTION_HELPER_TEXT.jobsToBeDone}
              isUpdating={recentlyUpdated.has('jobsToBeDone')}
            />
          </div>

          {/* Column 2: Solution + Key Metrics (stacked) */}
          <div className="slc-col slc-col-stacked">
            <CanvasSection
              sectionKey="solution"
              content={localSections.solution || ''}
              onSave={(content) => handleSectionSave('solution', content)}
              onFocus={() => handleSectionFocus('solution')}
              helperText={SECTION_HELPER_TEXT.solution}
              isUpdating={recentlyUpdated.has('solution')}
            />
            <CanvasSection
              sectionKey="keyMetrics"
              content={localSections.keyMetrics || ''}
              onSave={(content) => handleSectionSave('keyMetrics', content)}
              onFocus={() => handleSectionFocus('keyMetrics')}
              helperText={SECTION_HELPER_TEXT.keyMetrics}
              isUpdating={recentlyUpdated.has('keyMetrics')}
            />
          </div>

          {/* Column 3: Value Proposition (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="valueProposition"
              content={localSections.valueProposition || ''}
              onSave={(content) => handleSectionSave('valueProposition', content)}
              onFocus={() => handleSectionFocus('valueProposition')}
              helperText={SECTION_HELPER_TEXT.valueProposition}
              isUpdating={recentlyUpdated.has('valueProposition')}
            />
          </div>

          {/* Column 4: Advantage + Channels (stacked) */}
          <div className="slc-col slc-col-stacked">
            <CanvasSection
              sectionKey="advantage"
              content={localSections.advantage || ''}
              onSave={(content) => handleSectionSave('advantage', content)}
              onFocus={() => handleSectionFocus('advantage')}
              helperText={SECTION_HELPER_TEXT.advantage}
              isUpdating={recentlyUpdated.has('advantage')}
            />
            <CanvasSection
              sectionKey="channels"
              content={localSections.channels || ''}
              onSave={(content) => handleSectionSave('channels', content)}
              onFocus={() => handleSectionFocus('channels')}
              helperText={SECTION_HELPER_TEXT.channels}
              isUpdating={recentlyUpdated.has('channels')}
            />
          </div>

          {/* Column 5: Customers (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="customers"
              content={localSections.customers || ''}
              onSave={(content) => handleSectionSave('customers', content)}
              onFocus={() => handleSectionFocus('customers')}
              helperText={SECTION_HELPER_TEXT.customers}
              isUpdating={recentlyUpdated.has('customers')}
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
            helperText={SECTION_HELPER_TEXT.costs}
            isUpdating={recentlyUpdated.has('costs')}
          />
          <CanvasSection
            sectionKey="revenue"
            content={localSections.revenue || ''}
            onSave={(content) => handleSectionSave('revenue', content)}
            onFocus={() => handleSectionFocus('revenue')}
            helperText={SECTION_HELPER_TEXT.revenue}
            isUpdating={recentlyUpdated.has('revenue')}
          />
        </div>
      </div>

      {/* Impact Model - Collapsible 2x4 grid below canvas */}
      {impactExpanded && (
        <ImpactModelInline
          impactModel={localImpactModel}
          onSave={handleImpactSave}
          isUpdating={recentlyUpdated.has('impact')}
        />
      )}
    </>
  );
}
