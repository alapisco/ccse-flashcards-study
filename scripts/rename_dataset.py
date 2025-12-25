#!/usr/bin/env python3
"""Convert an original CCSE dump into the canonical dataset format used by this app.

Expected input (approx):
{
  "topics": [{"id": 1, "name": "..."}, ...],
  "questions": [{"id": "1001", "topicId": 1, "question": "...", "options": [...], "answer": "a"}, ...]
}

Output (canonical):
{
  "datasetVersion": "ccse-2-26",
  "tareas": [{"id": 1, "name": "..."}, ...],
  "questions": [{"id": "1001", "tareaId": 1, ... , "type": "mcq"|"tf"}]
}

Note: In this project, topicId is treated as tareaId (DESIGN.md).
"""

from __future__ import annotations

import argparse
import json
from typing import Any, Dict, List


def infer_type(options: List[Dict[str, Any]]) -> str:
    return "tf" if len(options) == 2 else "mcq"


def main() -> int:
    parser = argparse.ArgumentParser(description="Rename/normalize CCSE dataset to canonical format")
    parser.add_argument("input", help="Path to input JSON")
    parser.add_argument("output", help="Path to output JSON")
    parser.add_argument(
        "--dataset-version",
        default="ccse-2-26",
        help="datasetVersion string (default: ccse-2-26)",
    )
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        raw = json.load(f)

    topics = raw.get("topics") or raw.get("tareas") or []
    raw_questions = raw.get("questions") or []

    tareas = [{"id": int(t["id"]), "name": t.get("name", "") or ""} for t in topics]

    questions: List[Dict[str, Any]] = []
    for q in raw_questions:
        tarea_id = q.get("tareaId")
        if tarea_id is None:
            tarea_id = q.get("topicId")
        tarea_id = int(tarea_id)

        options = q.get("options") or []
        out = {
            "id": str(q.get("id")),
            "tareaId": tarea_id,
            "question": q.get("question", ""),
            "options": options,
            "answer": q.get("answer"),
            "type": q.get("type") or infer_type(options),
        }
        questions.append(out)

    canonical = {
        "datasetVersion": args.dataset_version,
        "tareas": tareas,
        "questions": questions,
    }

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(canonical, f, ensure_ascii=False, indent=2)
        f.write("\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
