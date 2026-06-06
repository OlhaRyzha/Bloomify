#!/usr/bin/env python3
"""Validate local Codex skill metadata."""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS_DIR = ROOT / ".codex" / "skills"
FRONTMATTER_RE = re.compile(r"^---\n(?P<body>.*?)\n---\n", re.DOTALL)


def parse_simple_yaml(text: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        values[key.strip()] = value
    return values


def validate_skill(skill_dir: Path) -> list[str]:
    errors: list[str] = []
    skill_md = skill_dir / "SKILL.md"
    openai_yaml = skill_dir / "agents" / "openai.yaml"

    if not skill_md.exists():
        return [f"{skill_dir}: missing SKILL.md"]

    content = skill_md.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(content)
    if not match:
        errors.append(f"{skill_md}: missing YAML frontmatter")
        return errors

    frontmatter = parse_simple_yaml(match.group("body"))
    name = frontmatter.get("name", "")
    description = frontmatter.get("description", "")

    if not name:
        errors.append(f"{skill_md}: missing frontmatter name")
    if not description:
        errors.append(f"{skill_md}: missing frontmatter description")
    if name and name != skill_dir.name:
        errors.append(
            f"{skill_md}: name '{name}' does not match directory '{skill_dir.name}'"
        )

    if not openai_yaml.exists():
        errors.append(f"{openai_yaml}: missing agents/openai.yaml")
        return errors

    agent_metadata = parse_simple_yaml(openai_yaml.read_text(encoding="utf-8"))
    display_name = agent_metadata.get("display_name", "")
    short_description = agent_metadata.get("short_description", "")
    default_prompt = agent_metadata.get("default_prompt", "")

    if not display_name:
        errors.append(f"{openai_yaml}: missing interface.display_name")
    if not short_description:
        errors.append(f"{openai_yaml}: missing interface.short_description")
    elif not 25 <= len(short_description) <= 64:
        errors.append(
            f"{openai_yaml}: short_description must be 25-64 chars "
            f"(got {len(short_description)})"
        )
    if not default_prompt:
        errors.append(f"{openai_yaml}: missing interface.default_prompt")
    elif name and f"${name}" not in default_prompt:
        errors.append(f"{openai_yaml}: default_prompt must mention ${name}")

    return errors


def main() -> int:
    if not SKILLS_DIR.exists():
        print(f"[ERROR] Skills directory not found: {SKILLS_DIR}")
        return 1

    skill_dirs = sorted(path for path in SKILLS_DIR.iterdir() if path.is_dir())
    errors: list[str] = []
    for skill_dir in skill_dirs:
        errors.extend(validate_skill(skill_dir))

    if errors:
        print("[ERROR] Skill validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"[OK] Validated {len(skill_dirs)} skills.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
