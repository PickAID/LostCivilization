#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


IGNORED_DIRECTORIES = {"artifacts", "__pycache__"}
IGNORED_FILENAMES = {".DS_Store"}


def discover_skill_dirs(skills_root: Path) -> list[Path]:
    if not skills_root.exists():
        return []

    skill_dirs: list[Path] = []
    for child in sorted(skills_root.iterdir()):
        if not child.is_dir():
            continue
        if child.name in IGNORED_DIRECTORIES or child.name.startswith("."):
            continue
        if (child / "SKILL.md").exists():
            skill_dirs.append(child)
    return skill_dirs


def iter_skill_files(skill_dir: Path) -> list[Path]:
    files: list[Path] = []
    for path in sorted(skill_dir.rglob("*")):
        if path.is_dir():
            if path.name in IGNORED_DIRECTORIES:
                continue
            continue
        if path.name in IGNORED_FILENAMES:
            continue
        if any(part in IGNORED_DIRECTORIES for part in path.relative_to(skill_dir).parts):
            continue
        files.append(path)
    return files


def package_skill(skill_dir: Path, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    zip_path = output_dir / f"{skill_dir.name}.zip"
    if zip_path.exists():
        zip_path.unlink()

    with ZipFile(zip_path, "w", compression=ZIP_DEFLATED) as archive:
        for file_path in iter_skill_files(skill_dir):
            relative_path = file_path.relative_to(skill_dir)
            archive.write(file_path, arcname=str(Path(skill_dir.name) / relative_path))

    return zip_path


def build_manifest(
    skill_dirs: list[Path],
    skills_root: Path,
    output_dir: Path,
    zip_paths: list[Path],
) -> dict:
    zip_lookup = {zip_path.stem: zip_path for zip_path in zip_paths}
    return {
        "skills_root": str(skills_root),
        "artifacts_dir": str(output_dir),
        "skills": [
            {
                "name": skill_dir.name,
                "source": str(skill_dir),
                "zip": str(zip_lookup[skill_dir.name]),
            }
            for skill_dir in skill_dirs
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Package repo-local Codex skills into zip files.")
    parser.add_argument("--skills-root", type=Path, default=Path("skills"))
    parser.add_argument("--output-dir", type=Path, default=Path("skills/artifacts"))
    parser.add_argument("--skill", action="append", dest="skills")
    parser.add_argument("--list-only", action="store_true")
    parser.add_argument("--json", action="store_true", dest="as_json")
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args()

    skills_root = args.skills_root.expanduser().resolve()
    output_dir = args.output_dir.expanduser().resolve()
    all_skill_dirs = discover_skill_dirs(skills_root)
    requested_names = set(args.skills or [])

    if requested_names:
        selected_skill_dirs = [skill_dir for skill_dir in all_skill_dirs if skill_dir.name in requested_names]
        missing = sorted(requested_names - {skill_dir.name for skill_dir in selected_skill_dirs})
        if missing:
            print(f"[ERROR] Unknown skill(s): {', '.join(missing)}", file=sys.stderr)
            return 1
    else:
        selected_skill_dirs = all_skill_dirs

    skill_names = [skill_dir.name for skill_dir in selected_skill_dirs]

    if args.list_only:
        if args.as_json:
            print(json.dumps(skill_names))
        else:
            for name in skill_names:
                print(name)
        return 0

    zip_paths = [package_skill(skill_dir, output_dir) for skill_dir in selected_skill_dirs]

    if args.manifest:
        manifest_path = args.manifest.expanduser().resolve()
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest = build_manifest(
            selected_skill_dirs,
            skills_root,
            output_dir,
            zip_paths,
        )
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    for zip_path in zip_paths:
        print(zip_path)

    return 0


if __name__ == "__main__":
    sys.exit(main())
