#!/usr/bin/env python3
from __future__ import annotations

"""
ClawRank OpenClaw Ingestion Script

Scans local OpenClaw session transcripts, aggregates token usage into
daily agent facts, and POSTs them to the ClawRank API.

Usage:
    python3 ingest.py [--dry-run] [--endpoint URL] [--agents-dir DIR]

Environment:
    CLAWRANK_API_TOKEN    - Required. Bearer token for ClawRank API.
    CLAWRANK_ENDPOINT     - API base URL (default: https://clawrank.dev).
    CLAWRANK_OWNER_NAME   - Display name for the owner (default: hostname).
    CLAWRANK_AGENTS_DIR   - Override agents directory (default: ~/.openclaw/agents).
"""

import argparse
import json
import os
import platform
import re
import sys
import urllib.request
import urllib.error
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


# ── Config ──────────────────────────────────────────────────────────────────

DEFAULT_ENDPOINT = "https://clawrank.dev"
SUBMIT_PATH = "/api/submit"


def get_agents_dir(override: str | None = None) -> Path:
    if override:
        return Path(override).expanduser()
    env = os.environ.get("CLAWRANK_AGENTS_DIR")
    if env:
        return Path(env).expanduser()
    return Path.home() / ".openclaw" / "agents"


def get_endpoint(override: str | None = None) -> str:
    if override:
        return override.rstrip("/")
    return os.environ.get("CLAWRANK_ENDPOINT", DEFAULT_ENDPOINT).rstrip("/")


def get_token() -> str | None:
    return os.environ.get("CLAWRANK_API_TOKEN")


def get_owner_name() -> str:
    return os.environ.get("CLAWRANK_OWNER_NAME", platform.node() or "Unknown Owner")


# ── Session Index Parsing ───────────────────────────────────────────────────

def discover_agents(agents_dir: Path) -> list[tuple[str, Path]]:
    """Return list of (agent_key, sessions.json path) for each agent."""
    results = []
    if not agents_dir.is_dir():
        return results
    for agent_dir in sorted(agents_dir.iterdir()):
        if not agent_dir.is_dir():
            continue
        index_path = agent_dir / "sessions" / "sessions.json"
        if index_path.is_file():
            results.append((agent_dir.name, index_path))
    return results


def load_session_index(index_path: Path) -> dict:
    """Load and return the sessions.json index."""
    with open(index_path, "r") as f:
        return json.load(f)


# ── JSONL Transcript Parsing ────────────────────────────────────────────────

def parse_transcript(session_path: Path, agent_key: str) -> list[dict]:
    """
    Parse a single JSONL transcript file and return usage message dicts.
    Tracks model_change events to attribute usage to the correct model.
    """
    if not session_path.is_file():
        return []

    messages = []
    current_model = ""
    current_provider = "unknown"

    with open(session_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            entry_type = entry.get("type")

            if entry_type == "model_change":
                current_model = entry.get("modelId", current_model)
                current_provider = entry.get("provider", current_provider)
                continue

            if entry_type != "message":
                continue

            msg = entry.get("message")
            if not msg or msg.get("role") != "assistant":
                continue

            usage = msg.get("usage")
            if not usage or not current_model:
                continue

            input_tokens = max(0, int(usage.get("input", 0) or 0))
            output_tokens = max(0, int(usage.get("output", 0) or 0))
            cache_read = max(0, int(usage.get("cacheRead", 0) or 0))
            cache_write = max(0, int(usage.get("cacheWrite", 0) or 0))
            total = max(
                input_tokens + output_tokens + cache_read + cache_write,
                int(usage.get("totalTokens", 0) or 0),
            )
            cost = max(0.0, float((usage.get("cost") or {}).get("total", 0) or 0))

            # Determine timestamp
            ts_ms = msg.get("timestamp")
            if not ts_ms:
                iso_ts = entry.get("timestamp")
                if iso_ts:
                    try:
                        dt = datetime.fromisoformat(iso_ts.replace("Z", "+00:00"))
                        ts_ms = int(dt.timestamp() * 1000)
                    except (ValueError, TypeError):
                        pass
            if not ts_ms:
                ts_ms = int(session_path.stat().st_mtime * 1000)
            if not ts_ms:
                continue

            messages.append({
                "agent_key": agent_key,
                "timestamp_ms": int(ts_ms),
                "model_id": current_model,
                "provider_id": current_provider or "unknown",
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cache_read_tokens": cache_read,
                "cache_write_tokens": cache_write,
                "total_tokens": total,
                "estimated_cost_usd": cost,
                "session_id": session_path.stem,
            })

    return messages


def resolve_session_path(index_path: Path, entry: dict) -> Path | None:
    """Resolve the session file path from an index entry."""
    session_file = (entry.get("sessionFile") or "").strip()
    if session_file:
        p = Path(session_file).expanduser()
        if p.is_absolute():
            return p
        return index_path.parent / p

    session_id = (entry.get("sessionId") or "").strip()
    if session_id:
        return index_path.parent / f"{session_id}.jsonl"

    return None


# ── Aggregation (Usage Messages → Daily Facts) ─────────────────────────────

def slugify(value: str) -> str:
    s = re.sub(r"[^\w\s-]", "", value.strip().lower())
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s or "unknown-agent"


def title_case(value: str) -> str:
    return " ".join(w.capitalize() for w in re.split(r"[-_\s]+", value) if w)


def aggregate_to_daily_facts(
    messages: list[dict],
    agent_key: str,
    owner_name: str,
) -> dict | None:
    """
    Aggregate usage messages for one agent into a DailyFactSubmission.
    Returns None if no messages.
    """
    if not messages:
        return None

    agent_name = title_case(agent_key)
    agent_slug = slugify(agent_name)

    # Bucket by date
    by_date: dict[str, dict] = defaultdict(lambda: {
        "total_tokens": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "cache_read_tokens": 0,
        "cache_write_tokens": 0,
        "estimated_cost_usd": 0.0,
        "sessions": set(),
        "session_bounds": defaultdict(lambda: {"min": float("inf"), "max": 0}),
        "hours": defaultdict(int),
        "model_totals": defaultdict(int),
    })

    for m in messages:
        dt = datetime.fromtimestamp(m["timestamp_ms"] / 1000, tz=timezone.utc)
        date_str = dt.strftime("%Y-%m-%d")
        hour = dt.hour
        sid = m["session_id"]

        bucket = by_date[date_str]
        bucket["total_tokens"] += m["total_tokens"]
        bucket["input_tokens"] += m["input_tokens"]
        bucket["output_tokens"] += m["output_tokens"]
        bucket["cache_read_tokens"] += m["cache_read_tokens"]
        bucket["cache_write_tokens"] += m["cache_write_tokens"]
        bucket["estimated_cost_usd"] += m["estimated_cost_usd"]
        bucket["sessions"].add(sid)
        bounds = bucket["session_bounds"][sid]
        bounds["min"] = min(bounds["min"], m["timestamp_ms"])
        bounds["max"] = max(bounds["max"], m["timestamp_ms"])
        bucket["hours"][hour] += m["total_tokens"]
        bucket["model_totals"][m["model_id"]] += m["total_tokens"]

    facts = []
    for date_str in sorted(by_date.keys()):
        b = by_date[date_str]

        longest_run_s = 0
        for bounds in b["session_bounds"].values():
            dur = max(0, round((bounds["max"] - bounds["min"]) / 1000))
            longest_run_s = max(longest_run_s, dur)

        most_active_hour = None
        if b["hours"]:
            most_active_hour = max(b["hours"], key=lambda h: (b["hours"][h], -h))

        top_model = None
        if b["model_totals"]:
            top_model = max(b["model_totals"], key=lambda m: (b["model_totals"][m], m))

        facts.append({
            "date": date_str,
            "totalTokens": b["total_tokens"],
            "inputTokens": b["input_tokens"],
            "outputTokens": b["output_tokens"],
            "cacheReadTokens": b["cache_read_tokens"],
            "cacheWriteTokens": b["cache_write_tokens"],
            "sessionCount": len(b["sessions"]),
            "longestRunSeconds": longest_run_s,
            "mostActiveHour": most_active_hour,
            "topModel": top_model,
            "estimatedCostUsd": round(b["estimated_cost_usd"], 4),
            "sourceType": "skill",
            "sourceAdapter": "openclaw",
        })

    return {
        "agent": {
            "slug": agent_slug,
            "agentName": agent_name,
            "ownerName": owner_name,
            "state": "live",
            "sourceOfTruth": "skill",
        },
        "facts": facts,
    }


# ── HTTP Submission ─────────────────────────────────────────────────────────

def submit(endpoint: str, token: str, submission: dict) -> dict:
    """POST a DailyFactSubmission to the ClawRank API. Returns response JSON."""
    url = f"{endpoint}{SUBMIT_PATH}"
    body = json.dumps(submission).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        return {"error": f"HTTP {e.code}: {error_body}"}
    except urllib.error.URLError as e:
        return {"error": f"Connection error: {e.reason}"}


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Ingest OpenClaw session data into ClawRank",
    )
    parser.add_argument("--dry-run", action="store_true", help="Parse and aggregate but don't submit")
    parser.add_argument("--endpoint", type=str, default=None, help="ClawRank API base URL")
    parser.add_argument("--agents-dir", type=str, default=None, help="Override agents directory")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    args = parser.parse_args()

    endpoint = get_endpoint(args.endpoint)
    token = get_token()
    owner_name = get_owner_name()
    agents_dir = get_agents_dir(args.agents_dir)

    if not args.dry_run and not token:
        print("ERROR: CLAWRANK_API_TOKEN is required (set in env or openclaw.json skill config)", file=sys.stderr)
        sys.exit(1)

    if not agents_dir.is_dir():
        print(f"ERROR: Agents directory not found: {agents_dir}", file=sys.stderr)
        sys.exit(1)

    agents = discover_agents(agents_dir)
    if not agents:
        print(f"No agents found in {agents_dir}", file=sys.stderr)
        sys.exit(0)

    print(f"ClawRank ingestion — {len(agents)} agent(s) found in {agents_dir}")
    print(f"Endpoint: {endpoint}")
    print(f"Owner: {owner_name}")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print()

    total_messages = 0
    total_facts = 0
    total_submitted = 0

    for agent_key, index_path in agents:
        index = load_session_index(index_path)
        all_messages = []

        for session_key, entry in index.items():
            session_path = resolve_session_path(index_path, entry)
            if not session_path or not session_path.is_file():
                continue
            msgs = parse_transcript(session_path, agent_key)
            all_messages.extend(msgs)

        if not all_messages:
            if args.verbose:
                print(f"  [{agent_key}] No usage data found")
            continue

        submission = aggregate_to_daily_facts(all_messages, agent_key, owner_name)
        if not submission:
            continue

        n_facts = len(submission["facts"])
        n_msgs = len(all_messages)
        total_tokens = sum(f["totalTokens"] for f in submission["facts"])
        total_cost = sum(f["estimatedCostUsd"] for f in submission["facts"])
        total_messages += n_msgs
        total_facts += n_facts

        print(f"  [{agent_key}] {n_msgs} messages → {n_facts} daily facts, "
              f"{total_tokens:,} tokens, ${total_cost:.2f}")

        if args.dry_run:
            if args.verbose:
                print(json.dumps(submission, indent=2, default=str))
            continue

        result = submit(endpoint, token, submission)
        if result.get("error"):
            print(f"    ✗ Submit failed: {result['error']}", file=sys.stderr)
        else:
            print(f"    ✓ Submitted → {result.get('agent', {}).get('slug', '?')} "
                  f"({result.get('upsertedFacts', 0)} facts upserted)")
            total_submitted += n_facts

    print()
    print(f"Done. {total_messages} messages parsed, {total_facts} daily facts generated"
          + (f", {total_submitted} submitted" if not args.dry_run else " (dry run, nothing submitted)"))


if __name__ == "__main__":
    main()
