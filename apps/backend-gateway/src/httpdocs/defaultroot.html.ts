/**
 * Default root HTML page for the Backend API Gateway
 * Provides a technical landing page with status and API docs link
 *
 * @returns HTML string for the root page
 */
import { APP_VERSION } from '../version';

export const defaultRootHtml = (): string => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0f172a" />
    <title>CarmenSoftware API Gateway</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      html, body { height: 100%; }

      body {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', system-ui, sans-serif;
        background: #0a0e1a;
        color: #e2e8f0;
        line-height: 1.6;
        overflow: hidden;
      }

      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image:
          linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
        background-size: 60px 60px;
        animation: gridMove 20s linear infinite;
      }

      body::after {
        content: '';
        position: fixed;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(ellipse at 30% 20%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
        pointer-events: none;
      }

      @keyframes gridMove {
        0% { transform: translate(0, 0); }
        100% { transform: translate(60px, 60px); }
      }

      .wrapper {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 520px;
        padding: 1rem;
      }

      .card {
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(56, 189, 248, 0.15);
        border-radius: 16px;
        padding: 2.5rem 2rem;
        box-shadow:
          0 0 0 1px rgba(56, 189, 248, 0.05),
          0 20px 50px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      .status-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
        padding-bottom: 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .status-text {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        font-weight: 500;
        color: #22c55e;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .logo-section {
        text-align: center;
        margin-bottom: 2rem;
      }

      .logo-icon {
        font-size: 2rem;
        margin-bottom: 0.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(139, 92, 246, 0.15));
        border: 1px solid rgba(56, 189, 248, 0.2);
        border-radius: 14px;
      }

      .logo-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #f1f5f9;
        letter-spacing: -0.02em;
        margin-bottom: 0.25rem;
      }

      .logo-title span {
        background: linear-gradient(135deg, #38bdf8, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .logo-sub {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem;
        color: #64748b;
        letter-spacing: 0.05em;
      }

      .cta-section {
        text-align: center;
        margin-bottom: 1.75rem;
      }

      .cta-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.75rem;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: #fff;
        font-weight: 600;
        font-size: 0.875rem;
        border-radius: 10px;
        text-decoration: none;
        transition: all 0.2s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
      }

      .cta-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
        filter: brightness(1.1);
      }

      .cta-button:active {
        transform: translateY(0);
      }

      .cta-icon {
        font-size: 1rem;
      }

      .footer {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }

      .footer-link {
        font-size: 0.7rem;
        color: #334155;
        text-decoration: none;
        transition: color 0.15s ease;
      }

      .footer-link:hover {
        color: #38bdf8;
      }

      @media (max-width: 480px) {
        .card { padding: 1.75rem 1.25rem; }
        .logo-title { font-size: 1.25rem; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation: none !important; transition: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <main class="card">

        <div class="status-bar">
          <div class="status-dot"></div>
          <span class="status-text">Operational</span>
        </div>

        <div class="logo-section">
          <div class="logo-icon">&#9889;</div>
          <h1 class="logo-title"><span>Carmen</span> API Gateway</h1>
          <p class="logo-sub">v${APP_VERSION}</p>
        </div>

        <div class="cta-section">
          <a href="/swagger" class="cta-button">
            <span class="cta-icon">&#128214;</span>
            Explore API Documentation
          </a>
        </div>

        <footer class="footer">
          <a
            href="https://www.carmensoftware.com"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
          >
            carmensoftware.com
          </a>
        </footer>

      </main>
    </div>
  </body>
</html>`;
};
