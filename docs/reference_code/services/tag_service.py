"""Helpers for aggregating tags from manifest entries."""
from __future__ import annotations

from typing import Iterable


def aggregate_tags(entries: list[dict], categories: Iterable[tuple[str, str]]) -> tuple[dict[str, dict[str, list[str]]], dict[str, set[str]]]:
    """Aggregate per-doc tags and project-level tag values from manifest entries."""
    tag_values = {key: set() for key, _ in categories}
    doc_tags: dict[str, dict[str, list[str]]] = {}
    for entry in entries:
        status = str(entry.get("status") or "")
        if status not in {"ingest", "tags"}:
            continue
        doc_id = entry.get("doc_id")
        if not doc_id:
            continue
        tags = entry.get("tags")
        if not isinstance(tags, dict):
            continue
        per_doc: dict[str, list[str]] = {}
        for key, _ in categories:
            values = tags.get(key)
            if not values:
                continue
            if isinstance(values, str):
                candidate = [values]
            elif isinstance(values, (list, tuple, set)):
                candidate = list(values)
            else:
                candidate = [values]
            cleaned = [str(item).strip() for item in candidate if str(item).strip()]
            if not cleaned:
                continue
            per_doc[key] = cleaned
            tag_values[key].update(cleaned)
        if per_doc:
            doc_tags[str(doc_id)] = per_doc
    return doc_tags, tag_values


__all__ = ["aggregate_tags"]
