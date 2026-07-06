# Skill Architecture

Each skill is a self‑contained knowledge unit that Claude (or any AI) can invoke.
- Skills live in `.claude/skills/<skill-name>/SKILL.md`
- They define:
  - **Purpose** – what the skill does.
  - **Inputs / Outputs** – expected data.
  - **Dependencies** – other skills it relies on.
  - **Example prompts** – how to invoke it.

All skills are loaded into Claude’s context automatically when needed.
