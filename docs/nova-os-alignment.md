# NovaAI Operating System Alignment

NovaAI is being developed as a **private AI workspace for thinking, creation, engineering, research, and personal productivity**, rather than as a simple chat interface. The platform is branded as **NovaAI** and created by **VirgoYT**. This document maps the supplied product specification to the current implementation without overstating unavailable capabilities.

## Current Capability Map

| Product area | Current status | What users can do now | Planned extension |
| --- | --- | --- | --- |
| Model system | Implemented foundation | Choose Groq, Kie AI, and OpenRouter-compatible models; view speed/pricing guidance, an operating-mode-aware recommendation, and a local session outcome summary. | Add opt-in automatic routing only after users can review its rules and override it. |
| Specialist agents | Implemented foundation | Choose Developer, Research, Creator, Gaming, or System profiles, which select the corresponding persisted operating mode. | Add user-created agent instructions and explicit multi-step approval flows. |
| Development workspace | Implemented foundation | Create projects, edit and preview files, run bounded commands, and connect GitHub repositories for context. | Add repository analysis reports, README generation, and CI helper workflows. |
| Terminal | Bounded workspace support | Run project-scoped commands through the existing guarded terminal controls. | Add explicit permission prompts and a user-visible execution audit trail. No unrestricted host access is promised. |
| Memory and privacy | Implemented foundation | Enable or pause history injection, store sensitive values in a private vault, export text-only conversations, and import a new private conversation. | Add editable saved memories, knowledge-base organization, and retention controls. |
| Files and media | Implemented foundation | Upload files, analyze uploaded images, generate images, record and transcribe voice, and read replies aloud in supported browsers. | Add PDF/document extraction, archive inspection, and richer code-file analysis workflows. |
| Interface | Implemented | Use responsive chat, folders, search, workspace, models, vault, settings, developer documentation, and theme controls. | Add a unified dashboard for files, agents, projects, and usage. |
| Security | Implemented foundation | Keep provider credentials server-side, isolate data by workspace, prevent vault values from appearing in chat history, and validate uploads/imports. | Add rate-limit telemetry, permission review UI, and a user-visible audit log. |

## Specialist Agent Profiles

NovaAI’s current agent profiles are **interaction presets**, not autonomous accounts with separate permissions. Selecting one changes the persisted operating mode that guides the next chat responses.

| Agent | Operating mode | Intended work |
| --- | --- | --- |
| Developer | Code | Architecture, debugging, implementation, tests, and secure maintenance. |
| Research | Research | Evidence-aware comparisons, summaries, assumptions, and next research steps. |
| Creator | Create | Scripts, writing, concepts, titles, descriptions, and content planning. |
| Gaming | Gaming | Game analysis, setup guidance, performance considerations, and game design. |
| System | Focus | Project organization, file planning, priorities, and practical next actions. |

## Safety and Execution Boundaries

NovaAI helps users reason through technical work and can run only the scoped platform actions exposed by its workspace. It does **not** promise unrestricted server, network, container, account, or credential access. Destructive, security-sensitive, or high-impact actions should be reviewed with the user before execution. NovaAI must not claim it completed an external action unless the connected workflow confirms the result.

Provider credentials and private vault values remain workspace-scoped. Conversation exports contain only text messages, excluding vault values and provider keys. Imported conversations create a new private session instead of replacing an existing chat.

## Next Platform Priorities

The next planned milestones are automatic model-routing recommendations, project usage and quality visibility, controlled terminal permission/audit records, user-editable memories and knowledge bases, richer file analysis, and opt-in agent workflows with approval steps. Longer-term concepts—including local model runtimes, plugins, collaboration, app builders, website builders, and APK assistance—are roadmap items rather than presently available features.
