# Nova AI - Project TODO

- [x] Database schema: groq_keys, chat_messages, secrets, chart_data, git_repos tables
- [x] Backend: Groq API streaming chat endpoint
- [x] Backend: API key validation (gsk_ prefix check)
- [x] Backend: Secret vault CRUD with AI context injection
- [x] Backend: Persistent chat memory (save/load per session)
- [x] Backend: Virtual PC terminal with SSE streaming
- [x] Backend: Git integration (configure remote, push)
- [x] Backend: Chart save/load
- [x] Backend: Project ZIP download
- [x] Frontend: Dark elegant theme
- [x] Frontend: API key gate
- [x] Frontend: Chat page with streaming (hooks before return)
- [x] Frontend: Vault page (hooks before return)
- [x] Frontend: Terminal page (hooks before return)
- [x] Frontend: Charts gallery page
- [x] Frontend: Git page
- [x] Frontend: Settings page with vault tab
- [x] Write vitest tests
- [x] Create checkpoint and deliver

## V2 Upgrades

- [x] Add database tables: custom_models, custom_tools, chat_attachments
- [x] Login page with Manus OAuth (Google/GitHub available via Manus)
- [x] GitHub authorization flow (authorize GitHub directly from app — button added to Git page + login page)
- [x] File/photo upload to chat (images, documents, code files)
- [x] Custom models API configuration (add any OpenAI-compatible endpoint)
- [x] Custom tools registration (user-defined AI tools)
- [x] Code analysis mode (complex bug finding, C#/C++ expertise)
- [x] 3D website generation capability (system prompt + expertise)
- [x] Enhance system prompt for code expert mode
- [x] Prepare deployable GitHub bundle (README, Dockerfile, env example)
- [x] Write tests for new features
- [x] Checkpoint and deliver

## Deployment

- [x] Create GitHub repo "advanced-personal-ai" and push project files
- [x] Save checkpoint and deliver with deployment URL

## Portable Source ZIP

- [x] Audit deployment configuration and required environment variables
- [x] Add portable deployment instructions for GitHub-hosted source
- [x] Generate and validate a complete Nova AI source-code ZIP
- [x] Fix and verify the public direct-download URL for the source ZIP
- [x] Point the in-app download button to the verified live project-zip endpoint

## Anonymous Direct Access

- [x] Remove the account sign-in requirement from the Nova AI entry flow
- [x] Create an anonymous browser-specific workspace identity for persistent data
- [x] Preserve Groq-key-gated chat history for the same browser/device without sign-in

## Optional Google Sign-In

- [x] Configure Google OAuth credentials and specify the authorized callback URL
- [x] Add an optional Google account sign-in control without blocking direct Groq access
- [x] Define and implement migration behavior for anonymous device workspaces after Google sign-in
- [x] User: add the production callback URL in Google Cloud Console before first Google sign-in

## API and Workspace Management

- [x] Add a secure Groq API-key removal control and return users to the key gate
- [x] Support replacing the active Groq API key without exposing the old value
- [x] Improve custom model API-key management for user-defined OpenAI-compatible APIs
- [x] Add selectable Ubuntu and Kali-style terminal workspace profiles with clear host-environment limits
- [x] Return a non-sensitive custom model key-status flag to the UI
- [x] Use the key-status flag to expose custom API-key replace and remove controls correctly

## GitHub Authorization Repair

- [x] Diagnose the GitHub authorization 404 from the live application
- [x] Repair the GitHub authorization entry route and callback configuration
- [ ] Verify the live GitHub authorization redirect and document any required GitHub settings
- [x] Bind GitHub OAuth state and stored connection tokens to each Nova AI workspace
- [x] Fix the OAuth callback to exchange GitHub’s authorization code after state validation
- [x] Show connected GitHub account status and clear authorization guidance in the Git page
- [x] Load GitHub connection status for anonymous device workspaces and verify connected-account display
- [x] Add explicit GitHub authorization guidance and callback error feedback in the Git page
- [x] Verify anonymous-workspace GitHub connected status and disconnect isolation end to end
- [x] Add regression coverage for GitHub status and disconnect behavior scoped to the current workspace
- [x] Add executable two-workspace tests for GitHub connection status and disconnect isolation
- [x] Verify a successful anonymous GitHub callback displays the linked account in the Git workspace
- [x] Add executable interface coverage that maps callback-linked GitHub status to the connected-account display
- [x] Move GitHub OAuth authorization and callback endpoints away from the conflicting deployment route
- [ ] User: update the GitHub OAuth App redirect URI to the non-conflicting callback route
- [x] Move GitHub OAuth to a deployment-routable two-segment API route
- [x] Verify the two-segment authorization route reaches the app shell in production and require an established-endpoint fallback
- [x] Route GitHub OAuth actions through the verified live project-download endpoint using explicit action parameters
- [ ] Verify the established endpoint returns a GitHub authorization redirect on the live site
- [ ] Live-test anonymous workspace GitHub status and disconnect branches on the established endpoint
- [ ] User: update the GitHub OAuth App redirect URI to the established endpoint callback URL and confirm callback success
