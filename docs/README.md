# signa-web knowledge base

> Responsibility: retrieval map — which doc answers which question.
> Update when: a doc is added, renamed, or moved.
> Sources: this docs/ tree

Detailed implementation docs for `signa-web`. Entry point and mandatory rules: [`../CLAUDE.md`](../CLAUDE.md).

## Map

| Question                                                   | Doc                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| Why this stack? What was rejected?                         | [stack.md](./stack.md)                               |
| How is the code organized? What are the providers?         | [architecture.md](./architecture.md)                 |
| What routes/layouts exist? Which are public vs guarded?    | [routing.md](./routing.md)                           |
| How does the HTTP client behave? How is env configured?    | [api/http-client.md](./api/http-client.md)           |
| Which endpoints does the web call?                         | [api/endpoints.md](./api/endpoints.md)               |
| What are the DTO shapes?                                   | [api/types.md](./api/types.md)                       |
| Where are tokens stored? How does login/guard/logout work? | [api/session.md](./api/session.md)                   |
| What color/font tokens exist?                              | [design-system/tokens.md](./design-system/tokens.md) |
| State of the landing page?                                 | [features/landing.md](./features/landing.md)         |
| State of the admin dashboard?                              | [features/dashboard.md](./features/dashboard.md)     |
| What is real vs stub? What is the tech debt?               | [status.md](./status.md)                             |

## Rules for these docs

- **Docs are code:** update the relevant doc in the **same commit** as the code change. Change→doc router: [`../CLAUDE.md`](../CLAUDE.md).
- **One responsibility per doc.** Each doc opens with a `Responsibility / Update when / Sources` header.
- **Split by update trigger, not by size.** Concerns that change on different triggers live in different files.
- **Single source of truth.** Do not duplicate a fact across docs — link to its canonical doc. If a doc contradicts the code, **the code wins**: fix the doc. `Sources` names the files to re-read.
- **Cross-repo facts** (endpoint contracts, roles, CORS) are owned by `signa-api`; here we document only how the web consumes them, and link back.
- **Language:** English for docs and identifiers; Spanish for user-facing UI copy.
