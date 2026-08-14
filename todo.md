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
- [ ] User: add the production callback URL in Google Cloud Console before first Google sign-in
