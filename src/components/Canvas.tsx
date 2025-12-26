import { useState, useEffect, useCallback } from 'react';
import { CanvasSection } from './CanvasSection';
import { ImpactPanel } from './ImpactPanel';
import {
  type CanvasSectionId,
  type ImpactModel,
  createEmptySections,
  createEmptyImpactModel,
} from '../types/canvas';

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
 */
export function Canvas({ canvasId }: CanvasProps) {
  const [sections, setSections] = useState(() =>
    createEmptySections(canvasId).reduce(
      (acc, section) => {
        acc[section.sectionKey] = section.content;
        return acc;
      },
      {} as Record<CanvasSectionId, string>
    )
  );

  const [impactModel, setImpactModel] = useState<ImpactModel>(() =>
    createEmptyImpactModel(canvasId)
  );

  const [showImpactPanel, setShowImpactPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load canvas state from backend on mount
  useEffect(() => {
    async function loadCanvas() {
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
            setSections(sectionsMap);
          }

          // Update impact model from backend
          if (data.impactModel) {
            setImpactModel(data.impactModel);
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

  const handleSectionSave = useCallback(async (sectionKey: CanvasSectionId, content: string) => {
    // Update local state immediately for responsiveness
    setSections((prev) => ({
      ...prev,
      [sectionKey]: content,
    }));

    // Persist to backend
    try {
      const response = await fetch(`/api/canvas/${canvasId}/section/${sectionKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to save section:', error);
      }
    } catch (err) {
      console.error('Failed to save section:', err);
    }
  }, [canvasId]);

  const handleImpactSave = useCallback(async (updatedImpact: ImpactModel) => {
    // Update local state immediately for responsiveness
    setImpactModel(updatedImpact);
    setShowImpactPanel(false);

    // Persist to backend
    try {
      const response = await fetch(`/api/canvas/${canvasId}/impact`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedImpact),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to save impact model:', error);
      }
    } catch (err) {
      console.error('Failed to save impact model:', err);
    }
  }, [canvasId]);

  // Show loading or error state
  if (isLoading || loadError) {
    return (
      <div className="slc-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loadError ? (
          <div style={{ color: 'var(--color-error, #e53e3e)', textAlign: 'center' }}>
            <p>{loadError}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
              Retry
            </button>
          </div>
        ) : (
          <div>Loading canvas...</div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="slc-canvas">
        {/* Top Row: Purpose & Impact */}
        <div className="slc-row slc-row-top">
          <CanvasSection
            sectionKey="purpose"
            content={sections.purpose || ''}
            onSave={(content) => handleSectionSave('purpose', content)}
            helperText={SECTION_HELPER_TEXT.purpose}
          />
          <div
            className={`canvas-section ${impactModel.impact ? 'completed' : ''}`}
            onClick={() => setShowImpactPanel(true)}
          >
            <div className="canvas-section-header">
              <span className="canvas-section-number">11</span>
              <span className="canvas-section-title">IMPACT</span>
              <span className={`canvas-section-status ${impactModel.impact ? 'complete' : ''}`}>
                {impactModel.impact ? '✓' : '○'}
              </span>
              <span className="canvas-section-model model-impact">impact</span>
            </div>
            <div
              className={`canvas-section-content ${!impactModel.impact ? 'helper' : ''}`}
            >
              {impactModel.impact || SECTION_HELPER_TEXT.impact}
            </div>
          </div>
        </div>

        {/* Middle Section: 5-column layout with varying heights */}
        <div className="slc-row slc-row-middle">
          {/* Column 1: Jobs To Be Done (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="jobsToBeDone"
              content={sections.jobsToBeDone || ''}
              onSave={(content) => handleSectionSave('jobsToBeDone', content)}
              helperText={SECTION_HELPER_TEXT.jobsToBeDone}
            />
          </div>

          {/* Column 2: Solution + Key Metrics (stacked) */}
          <div className="slc-col slc-col-stacked">
            <CanvasSection
              sectionKey="solution"
              content={sections.solution || ''}
              onSave={(content) => handleSectionSave('solution', content)}
              helperText={SECTION_HELPER_TEXT.solution}
            />
            <CanvasSection
              sectionKey="keyMetrics"
              content={sections.keyMetrics || ''}
              onSave={(content) => handleSectionSave('keyMetrics', content)}
              helperText={SECTION_HELPER_TEXT.keyMetrics}
            />
          </div>

          {/* Column 3: Value Proposition (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="valueProposition"
              content={sections.valueProposition || ''}
              onSave={(content) =>
                handleSectionSave('valueProposition', content)
              }
              helperText={SECTION_HELPER_TEXT.valueProposition}
            />
          </div>

          {/* Column 4: Advantage + Channels (stacked) */}
          <div className="slc-col slc-col-stacked">
            <CanvasSection
              sectionKey="advantage"
              content={sections.advantage || ''}
              onSave={(content) => handleSectionSave('advantage', content)}
              helperText={SECTION_HELPER_TEXT.advantage}
            />
            <CanvasSection
              sectionKey="channels"
              content={sections.channels || ''}
              onSave={(content) => handleSectionSave('channels', content)}
              helperText={SECTION_HELPER_TEXT.channels}
            />
          </div>

          {/* Column 5: Customers (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="customers"
              content={sections.customers || ''}
              onSave={(content) => handleSectionSave('customers', content)}
              helperText={SECTION_HELPER_TEXT.customers}
            />
          </div>
        </div>

        {/* Bottom Row: Costs & Revenue */}
        <div className="slc-row slc-row-bottom">
          <CanvasSection
            sectionKey="costs"
            content={sections.costs || ''}
            onSave={(content) => handleSectionSave('costs', content)}
            helperText={SECTION_HELPER_TEXT.costs}
          />
          <CanvasSection
            sectionKey="revenue"
            content={sections.revenue || ''}
            onSave={(content) => handleSectionSave('revenue', content)}
            helperText={SECTION_HELPER_TEXT.revenue}
          />
        </div>
      </div>

      {showImpactPanel && (
        <ImpactPanel
          impactModel={impactModel}
          onSave={handleImpactSave}
          onClose={() => setShowImpactPanel(false)}
        />
      )}
    </>
  );
}
