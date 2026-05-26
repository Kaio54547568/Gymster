# Gymster Agent Skills

This file defines how AI coding agents should work on the Gymster project.

Gymster is a gym management web application with multiple portals:
- Guest / Auth / Onboarding
- Member Portal
- Staff Portal
- PT / Trainer Portal
- Admin / Owner Portal

The project is currently a React/Vite frontend application and is gradually migrating from mock/hardcoded/localStorage data to Supabase.

---

## 1. General Working Rules

Before editing code:
1. Inspect the existing files, routes, components, services, mock data, and current behavior.
2. Understand which portal/page the task belongs to.
3. Make the smallest safe change that satisfies the request.
4. Do not rewrite unrelated features.
5. Do not migrate the whole app unless explicitly requested.
6. Do not remove fallback mock data unless explicitly requested.
7. After editing, list changed files and explain how to test.

When making changes:
- Keep the current Gymster dark red/black premium gym style.
- Keep all UI text in English unless explicitly requested otherwise.
- Preserve existing routing and role-based behavior.
- Do not break Admin, Staff, PT, Member, or Onboarding flows while working on one module.
- Prefer adding or updating service files rather than writing data-fetching logic directly inside UI components.
- Use clean English fallback text.
- Remove corrupted/mojibake text such as `GÃ`, `Nguyá`, `thÃ`, `Ä`.

---

## 2. Design System Rule

The project uses `DESIGN.md` as the source of truth for UI and visual design.

Before editing any:
- UI page
- layout
- component
- styling
- button
- card
- table
- modal
- form
- sidebar
- dashboard screen

the agent must read and follow `DESIGN.md`.

`DESIGN.md` controls:
- brand personality
- color palette
- typography
- spacing
- border radius
- shadows/elevation
- component style
- layout density
- button/input/card/table states
- visual do's and don'ts

When changing Gymster UI:
- Preserve the dark red/black gym dashboard identity.
- Reuse existing cards, buttons, inputs, tables, badges, sidebars, modals, and layout patterns.
- Do not introduce unrelated default colors such as blue/purple unless `DESIGN.md` allows it.
- Keep Member, Staff, PT, and Admin portals visually consistent.
- Add loading, error, and empty states when loading Supabase data.
- Keep responsive behavior: desktop layouts may use multiple columns, but mobile must stack cleanly.

If a user request conflicts with `DESIGN.md`, follow `DESIGN.md` and briefly explain the conflict in the final summary.

---

## 3. DESIGN.md CLI Workflow

The project uses `@google/design.md`.

When `DESIGN.md` is created or updated, run:

```bash
npx "@google/design.md" lint DESIGN.md