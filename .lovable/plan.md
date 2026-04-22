
Build and launch LitAudit as a polished web app for analyzing token contracts deployed on the LitVM testnet.

1. Ingest your existing TypeScript code
   - You’ll attach/upload the TypeScript files from your computer.
   - I’ll review the structure, identify the core contract-analysis logic, and integrate it into this TanStack Start app.
   - Replace the current blank placeholder page with the real LitAudit experience.

2. Create the LitAudit product flow
   - Build a clean homepage explaining LitAudit and the LitVM contract-audit use case.
   - Add a contract analysis interface where users can enter a LitVM testnet token contract address.
   - Display audit results in a clear, actionable format: risk summary, findings, severity levels, contract metadata, and recommended next steps.
   - Add loading, empty, error, and invalid-address states so the app feels reliable.

3. Connect LitVM network analysis
   - Wire the existing TypeScript logic to the UI.
   - If needed, add server-side API routes/functions for safe contract fetching and analysis.
   - Handle LitVM testnet RPC/API calls without exposing sensitive logic or keys in the browser.

4. Polish UI and branding
   - Create a professional security/audit-themed visual identity for LitAudit.
   - Improve layout, spacing, typography, responsive behavior, and mobile usability.
   - Add reusable UI sections for audit cards, severity badges, score summaries, and result details.

5. Debug and stabilize
   - Fix current runtime/build issues.
   - Validate TypeScript compatibility with the current app framework.
   - Add graceful handling for failed network requests, malformed contracts, unsupported tokens, and analysis failures.

6. Improve performance and SEO
   - Add proper page titles, descriptions, Open Graph metadata, and social preview metadata.
   - Optimize initial load, avoid unnecessary client-side work, and keep analysis logic appropriately scoped.
   - Ensure the public-facing pages are indexable and shareable.

7. Prepare for launch
   - Publish the app to a Lovable URL.
   - Guide the custom domain setup after publishing.
   - Verify the live app flow after deployment and iterate on any remaining polish or product improvements.
