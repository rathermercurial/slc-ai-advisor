/**
 * SLC AI Advisor - Main Application
 *
 * Chat-first interface for the Social Lean Canvas AI Advisor.
 * Canvas display will be added in task C4.
 */

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>SLC AI Advisor</h1>
        <p>AI-powered guidance for social entrepreneurs</p>
      </header>

      <main className="app-main">
        {/* Chat component will be added in task C2 */}
        <div className="placeholder">
          <p>Chat interface coming soon...</p>
          <p>
            This advisor helps you build your Social Lean Canvas using a
            138-tag taxonomy and curated knowledge base.
          </p>
        </div>
      </main>

      <footer className="app-footer">
        <p>Powered by Social Lean Canvas methodology</p>
      </footer>
    </div>
  );
}

export default App;
