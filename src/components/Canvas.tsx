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
  sessionId: string;
}

interface CanvasSectionData {
  sectionKey: CanvasSectionId;
  content: string;
  isComplete: boolean;
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
export function Canvas({ sessionId }: CanvasProps) {
  const [sections, setSections] = useState(() =>
    createEmptySections(sessionId).reduce(
      (acc, section) => {
        acc[section.sectionKey] = section.content;
        return acc;
      },
      {} as Record<CanvasSectionId, string>
    )
  );

  const [impactModel, setImpactModel] = useState<ImpactModel>(() =>
    createEmptyImpactModel(sessionId)
  );

  const [showImpactPanel, setShowImpactPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch canvas state on mount
  useEffect(() => {
    async function fetchCanvas() {
      try {
        const response = await fetch(`/api/session/${sessionId}/canvas`);
        if (!response.ok) {
          throw new Error('Failed to load canvas');
        }
        const data = await response.json();

        // Update sections from backend
        if (data.sections && Array.isArray(data.sections)) {
          const sectionsMap = data.sections.reduce(
            (acc: Record<CanvasSectionId, string>, s: CanvasSectionData) => {
              acc[s.sectionKey] = s.content;
              return acc;
            },
            {} as Record<CanvasSectionId, string>
          );
          setSections(sectionsMap);
        }

        // Update impact model from backend
        if (data.impactModel) {
          setImpactModel(data.impactModel);
        }
      } catch (err) {
        console.error('Failed to fetch canvas:', err);
        setError(err instanceof Error ? err.message : 'Failed to load canvas');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCanvas();
  }, [sessionId]);

  // Persist section to backend
  const persistSection = useCallback(async (sectionKey: CanvasSectionId, content: string) => {
    try {
      const response = await fetch(`/api/session/${sessionId}/canvas/${sectionKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        console.error('Failed to save section:', sectionKey);
      }
    } catch (err) {
      console.error('Failed to persist section:', err);
    }
  }, [sessionId]);

  // Persist impact model to backend
  const persistImpactModel = useCallback(async (model: ImpactModel) => {
    try {
      const response = await fetch(`/api/session/${sessionId}/canvas/impact-model`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: model.issue,
          participants: model.participants,
          activities: model.activities,
          outputs: model.outputs,
          shortTermOutcomes: model.shortTermOutcomes,
          mediumTermOutcomes: model.mediumTermOutcomes,
          longTermOutcomes: model.longTermOutcomes,
          impact: model.impact,
        }),
      });
      if (!response.ok) {
        console.error('Failed to save impact model');
      }
    } catch (err) {
      console.error('Failed to persist impact model:', err);
    }
  }, [sessionId]);

  const handleSectionSave = (sectionKey: CanvasSectionId, content: string) => {
    // Optimistic update
    setSections((prev) => ({
      ...prev,
      [sectionKey]: content,
    }));
    // Persist to backend
    persistSection(sectionKey, content);
  };

  const handleImpactSave = (updatedImpact: ImpactModel) => {
    // Optimistic update
    setImpactModel(updatedImpact);
    setShowImpactPanel(false);
    // Persist to backend
    persistImpactModel(updatedImpact);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="slc-canvas loading">
        <div className="canvas-loading">Loading canvas...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="slc-canvas error">
        <div className="canvas-error">
          <p>Failed to load canvas: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
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
