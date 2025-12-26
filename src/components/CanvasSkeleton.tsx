/**
 * Skeleton loading state for the Social Lean Canvas.
 * Matches the exact layout of the Canvas component with pulsing placeholders.
 */
export function CanvasSkeleton() {
  return (
    <div className="slc-canvas skeleton">
      {/* Top Row: Purpose & Impact */}
      <div className="slc-row slc-row-top">
        <div className="canvas-section skeleton-block">
          <div className="canvas-section-header">
            <span className="skeleton-text skeleton-number" />
            <span className="skeleton-text skeleton-title" />
          </div>
          <div className="skeleton-content">
            <span className="skeleton-line" />
            <span className="skeleton-line" />
            <span className="skeleton-line short" />
          </div>
        </div>
        <div className="canvas-section skeleton-block">
          <div className="canvas-section-header">
            <span className="skeleton-text skeleton-number" />
            <span className="skeleton-text skeleton-title" />
          </div>
          <div className="skeleton-content">
            <span className="skeleton-line" />
            <span className="skeleton-line" />
          </div>
        </div>
      </div>

      {/* Middle Section: 5-column layout */}
      <div className="slc-row slc-row-middle">
        {/* Column 1: Jobs To Be Done (double height) */}
        <div className="slc-col slc-col-double">
          <div className="canvas-section skeleton-block">
            <div className="canvas-section-header">
              <span className="skeleton-text skeleton-number" />
              <span className="skeleton-text skeleton-title" />
            </div>
            <div className="skeleton-content">
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line short" />
            </div>
          </div>
        </div>

        {/* Column 2: Solution + Key Metrics (stacked) */}
        <div className="slc-col slc-col-stacked">
          <div className="canvas-section skeleton-block">
            <div className="canvas-section-header">
              <span className="skeleton-text skeleton-number" />
              <span className="skeleton-text skeleton-title" />
            </div>
            <div className="skeleton-content">
              <span className="skeleton-line" />
              <span className="skeleton-line short" />
            </div>
          </div>
          <div className="canvas-section skeleton-block">
            <div className="canvas-section-header">
              <span className="skeleton-text skeleton-number" />
              <span className="skeleton-text skeleton-title" />
            </div>
            <div className="skeleton-content">
              <span className="skeleton-line" />
              <span className="skeleton-line short" />
            </div>
          </div>
        </div>

        {/* Column 3: Value Proposition (double height) */}
        <div className="slc-col slc-col-double">
          <div className="canvas-section skeleton-block">
            <div className="canvas-section-header">
              <span className="skeleton-text skeleton-number" />
              <span className="skeleton-text skeleton-title" />
            </div>
            <div className="skeleton-content">
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line short" />
            </div>
          </div>
        </div>

        {/* Column 4: Advantage + Channels (stacked) */}
        <div className="slc-col slc-col-stacked">
          <div className="canvas-section skeleton-block">
            <div className="canvas-section-header">
              <span className="skeleton-text skeleton-number" />
              <span className="skeleton-text skeleton-title" />
            </div>
            <div className="skeleton-content">
              <span className="skeleton-line" />
              <span className="skeleton-line short" />
            </div>
          </div>
          <div className="canvas-section skeleton-block">
            <div className="canvas-section-header">
              <span className="skeleton-text skeleton-number" />
              <span className="skeleton-text skeleton-title" />
            </div>
            <div className="skeleton-content">
              <span className="skeleton-line" />
              <span className="skeleton-line short" />
            </div>
          </div>
        </div>

        {/* Column 5: Customers (double height) */}
        <div className="slc-col slc-col-double">
          <div className="canvas-section skeleton-block">
            <div className="canvas-section-header">
              <span className="skeleton-text skeleton-number" />
              <span className="skeleton-text skeleton-title" />
            </div>
            <div className="skeleton-content">
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line short" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Costs & Revenue */}
      <div className="slc-row slc-row-bottom">
        <div className="canvas-section skeleton-block">
          <div className="canvas-section-header">
            <span className="skeleton-text skeleton-number" />
            <span className="skeleton-text skeleton-title" />
          </div>
          <div className="skeleton-content">
            <span className="skeleton-line" />
            <span className="skeleton-line" />
            <span className="skeleton-line short" />
          </div>
        </div>
        <div className="canvas-section skeleton-block">
          <div className="canvas-section-header">
            <span className="skeleton-text skeleton-number" />
            <span className="skeleton-text skeleton-title" />
          </div>
          <div className="skeleton-content">
            <span className="skeleton-line" />
            <span className="skeleton-line" />
            <span className="skeleton-line short" />
          </div>
        </div>
      </div>
    </div>
  );
}
