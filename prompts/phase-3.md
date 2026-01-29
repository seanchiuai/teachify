# Phase 3: Real-time Game Engine + Iframe Rendering

Build US-004, US-005, US-006 from `docs/PRD.md`.

Key components this phase:
- Game state machine (lobby → question → results → complete)
- GameIframe component (sandbox="allow-scripts", srcdoc, MessageChannel)
- Host view with controls
- Student join + play flow
- Authoritative timer in parent, answer validation via Convex

Check git log and files to see what's already done. Build the next incomplete feature. Test with agent-browser. Commit if tests pass.

Skills: `convex/`, `game-engine/`, `ui-components/`
Design: `docs/design.md`
Architecture: See "Architecture: AI-Generated HTML Games" section in `docs/PRD.md`

If you can't complete the acceptance criteria without human assistance, skip that part but make sure to report to user at the end of the loop on what still needs to be done.  When ALL acceptance criteria are met and tested:
<promise>PHASE 3 COMPLETE</promise>
