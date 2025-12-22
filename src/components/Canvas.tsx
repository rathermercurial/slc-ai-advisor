import { useState } from 'react';
import { CanvasSection } from './CanvasSection';
import { ImpactPanel } from './ImpactPanel';
import {
  CANVAS_SECTION_ORDER,
  type CanvasSectionId,
  type ImpactModel,
  createEmptySections,
  createEmptyImpactModel,
} from '../types/canvas';

interface CanvasProps {
  sessionId: string;
}

/**
 * The Social Lean Canvas grid with 11 sections.
 * Sections 1-10 use inline editing, section 11 (Impact) opens a slide-in panel.
 */
export function Canvas({ sessionId }: CanvasProps) {
  // Local state for demo - will be replaced with API calls
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

  const handleSectionSave = (sectionKey: CanvasSectionId, content: string) => {
    if (sectionKey === 'impact') {
      // Impact section opens panel instead
      setShowImpactPanel(true);
      return;
    }

    setSections((prev) => ({
      ...prev,
      [sectionKey]: content,
    }));

    // TODO: Call API to persist
    console.log(`Saved section ${sectionKey}:`, content);
  };

  const handleImpactSave = (updatedImpact: ImpactModel) => {
    setImpactModel(updatedImpact);
    setShowImpactPanel(false);

    // TODO: Call API to persist
    console.log('Saved impact model:', updatedImpact);
  };

  const handleImpactClick = () => {
    setShowImpactPanel(true);
  };

  return (
    <>
      <div className="canvas">
        {CANVAS_SECTION_ORDER.map((sectionKey) => {
          if (sectionKey === 'impact') {
            // Impact section - click opens panel
            return (
              <div
                key={sectionKey}
                className="canvas-section impact"
                onClick={handleImpactClick}
              >
                <div className="canvas-section-header">
                  <span className="canvas-section-number">11</span>
                  <span className="canvas-section-title">Impact</span>
                  <span className="canvas-section-model">impact</span>
                </div>
                <div
                  className={`canvas-section-content ${!impactModel.impact ? 'empty' : ''}`}
                >
                  {impactModel.impact || 'Click to define your impact model'}
                </div>
              </div>
            );
          }

          return (
            <CanvasSection
              key={sectionKey}
              sectionKey={sectionKey}
              content={sections[sectionKey] || ''}
              onSave={(content) => handleSectionSave(sectionKey, content)}
            />
          );
        })}
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
