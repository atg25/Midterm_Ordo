/**
 * Lighthouse CI configuration
 *
 * Targets a locally-running Next.js dev server.
 * Run: npm run lhci
 *
 * Score thresholds enforce the "deterministic tool as governance gate" model
 * described in Chapter 9. Every category is an objective, measurable signal
 * that human review or AI-generated code cannot self-report.
 */

/** @type {import('@lhci/cli').LighthouseRcFile} */
module.exports = {
  ci: {
    collect: {
      // Start the Next.js production build and measure it
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready on",
      startServerReadyTimeout: 30000,
      url: ["http://localhost:3000/"],
      numberOfRuns: 3,
    },
    assert: {
      preset: "lighthouse:no-pwa",
      assertions: {
        // Performance
        "categories:performance": ["error", { minScore: 0.9 }],
        // Accessibility — enforces the a11y rules we lint for
        "categories:accessibility": ["error", { minScore: 1.0 }],
        // Best practices
        "categories:best-practices": ["error", { minScore: 0.95 }],
        // SEO
        "categories:seo": ["error", { minScore: 0.9 }],

        // Core Web Vitals
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],

        // Accessibility specifics that must never regress
        "color-contrast": "error",
        "document-title": "error",
        "html-has-lang": "error",
        "image-alt": "error",
        "label": "error",
        "meta-description": "error",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
