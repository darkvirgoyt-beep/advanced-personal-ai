# Project TODO

- [ ] Define a central project-level LLM configuration module with the configurable system prompt and default model selection.
- [ ] Add database schema, migration, and scoped query helpers for conversations and ordered messages owned by the authenticated user.
- [ ] Implement protected chat procedures that create conversations, persist each turn, and pass recent conversation messages as multi-turn LLM context.
- [ ] Implement a secure streamed-completion endpoint that uses the server-side LLM proxy and saves the completed assistant response.
- [ ] Add a protected full-screen chat route with a conversation history panel, mobile drawer behavior, message composer, streaming state, and Markdown rendering.
- [ ] Build a hero landing page with animated AI headline, feature highlights, neon HUD framing, exact Start Chatting CTA, and Manus OAuth controls.
- [ ] Build a top navigation bar with branded logo, navigation links, responsive menu, and Manus OAuth login/logout controls.
- [ ] Apply a responsive cyberpunk visual system with black surfaces, neon pink and electric cyan glows, geometric typography, technical lines, and accessible contrast.
- [ ] Add automated tests for configuration validation, conversation ownership, and chat-context construction.
- [ ] Add GitHub-ready README and deployment instructions explaining the full-stack hosting requirements, required environment variables, database migration, and GitHub repository workflow.
- [ ] Run type checking and automated tests, then verify landing and chat layouts at desktop and mobile viewport sizes.
- [ ] Inspect and selectively integrate the existing AI logic, configuration, and project assets from darkvirgoyt-beep/advanced-personal-ai without exposing credentials or overwriting required Manus OAuth safeguards.
- [ ] Configure the supplied Hugging Face token as a server-only fallback provider option without committing the credential or exposing it to the browser.
- [ ] Configure the supplied Nemotron provider credential as a server-only high-capability fallback without committing the credential or exposing it to the browser.
- [ ] Prepare a non-destructive GitHub branch containing the completed Nova AI application and its deployment documentation.
