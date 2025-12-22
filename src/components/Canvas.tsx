import { useState } from 'react';
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

/**
 * Helper text shown when a section is empty.
 * Based on the official Social Lean Canvas.
 */
const SECTION_HELPER_TEXT: Record<CanvasSectionId, string> = {
  purpose:
    'Your reason for doing this venture, clearly defined in terms of the social or environmental problems you want to solve.',
  impact:
    'What is the intended social or environmental impact of your venture?',
  problem:
    'What are the specific problems each of the different customer types face?',
  solution: 'What is your product or service?',
  uniqueValueProposition:
    'What is the unique combination of benefits your product or service will offer to overcome problems the customer has?',
  unfairAdvantage: 'Why will this venture succeed ahead of the competition?',
  customerSegments:
    'Who do you need to move to make your business model work?',
  keyMetrics:
    'What are the numbers that will show your business model is working?',
  channels: 'How will you reach your customers in a scalable way?',
  costStructure:
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

  const handleSectionSave = (sectionKey: CanvasSectionId, content: string) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: content,
    }));
    console.log(`Saved section ${sectionKey}:`, content);
  };

  const handleImpactSave = (updatedImpact: ImpactModel) => {
    setImpactModel(updatedImpact);
    setShowImpactPanel(false);
    console.log('Saved impact model:', updatedImpact);
  };

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
            className="canvas-section"
            onClick={() => setShowImpactPanel(true)}
          >
            <div className="canvas-section-header">
              <span className="canvas-section-title">IMPACT</span>
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
          {/* Column 1: Problem (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="problem"
              content={sections.problem || ''}
              onSave={(content) => handleSectionSave('problem', content)}
              helperText={SECTION_HELPER_TEXT.problem}
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

          {/* Column 3: Unique Value Proposition (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="uniqueValueProposition"
              content={sections.uniqueValueProposition || ''}
              onSave={(content) =>
                handleSectionSave('uniqueValueProposition', content)
              }
              helperText={SECTION_HELPER_TEXT.uniqueValueProposition}
            />
          </div>

          {/* Column 4: Unfair Advantage + Channels (stacked) */}
          <div className="slc-col slc-col-stacked">
            <CanvasSection
              sectionKey="unfairAdvantage"
              content={sections.unfairAdvantage || ''}
              onSave={(content) => handleSectionSave('unfairAdvantage', content)}
              helperText={SECTION_HELPER_TEXT.unfairAdvantage}
            />
            <CanvasSection
              sectionKey="channels"
              content={sections.channels || ''}
              onSave={(content) => handleSectionSave('channels', content)}
              helperText={SECTION_HELPER_TEXT.channels}
            />
          </div>

          {/* Column 5: Customer Segments (double height) */}
          <div className="slc-col slc-col-double">
            <CanvasSection
              sectionKey="customerSegments"
              content={sections.customerSegments || ''}
              onSave={(content) => handleSectionSave('customerSegments', content)}
              helperText={SECTION_HELPER_TEXT.customerSegments}
            />
          </div>
        </div>

        {/* Bottom Row: Cost Structure & Revenue */}
        <div className="slc-row slc-row-bottom">
          <CanvasSection
            sectionKey="costStructure"
            content={sections.costStructure || ''}
            onSave={(content) => handleSectionSave('costStructure', content)}
            helperText={SECTION_HELPER_TEXT.costStructure}
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
