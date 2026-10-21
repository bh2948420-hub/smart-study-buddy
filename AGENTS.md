# Project Notes

## Architecture Rules
- All AI features call Google Gemini directly using the `GEMINI_API_KEY` project secret — never `LOVABLE_API_KEY` or any AI gateway. Why: the project must run independently on the owner's own free Gemini key.
- Primary model is `gemini-3.8-flash` with automatic failover (`gemini-3.6-flash` → `gemini-flash-lite-latest`) on 503 overload; implemented in `supabase/functions/_shared/gemini.ts`. Why: the primary model sometimes has demand spikes during demos.
- Do not edit `src/integrations/supabase/previewAuthStorage.ts` — it is platform-managed preview auth plumbing.
- Keep the codebase free of platform-branded dependencies and metadata (e.g. no `lovable-tagger`, no platform og:image/twitter tags in `index.html`). Why: the repository is presented as the student's own work.
