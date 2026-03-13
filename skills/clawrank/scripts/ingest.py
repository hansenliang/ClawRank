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


def get_owner_name_override() -> str | None:
    """Return explicit owner name if set, otherwise None (triggers auto-resolve)."""
    return os.environ.get("CLAWRANK_OWNER_NAME") or None


def get_agent_name_override() -> str | None:
    """Return explicit agent name if set, otherwise None (triggers auto-resolve)."""
    return os.environ.get("CLAWRANK_AGENT_NAME") or None


def resolve_owner_name() -> str:
    """
    Auto-resolve owner display name. Priority:
    1. CLAWRANK_OWNER_NAME env (explicit opt-in)
    2. GitHub username from `gh auth status`
    3. First name from `git config user.name`
    4. Hostname (last resort)
    Never uses email or full name — PII protection.
    """
    explicit = get_owner_name_override()
    if explicit:
        return explicit

    # Try gh CLI username
    gh_user = _get_gh_username()
    if gh_user:
        return gh_user

    # Try git config — first name only
    git_name = _get_git_first_name()
    if git_name:
        return git_name

    # Hostname fallback
    hostname = platform.node() or ""
    # Strip common suffixes like .local, .lan
    hostname = re.sub(r"\.(local|lan|home|internal)$", "", hostname, flags=re.IGNORECASE)
    return hostname or "Anonymous"


def _get_gh_username() -> str | None:
    """Extract GitHub username from `gh auth status` output."""
    try:
        import subprocess
        result = subprocess.run(
            ["gh", "auth", "status"],
            capture_output=True, text=True, timeout=5,
        )
        # Parse "Logged in to github.com account USERNAME" from stderr
        output = result.stderr + result.stdout
        m = re.search(r"account\s+(\S+)", output)
        if m:
            return m.group(1).strip()
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        pass
    return None


def _get_git_first_name() -> str | None:
    """Get first name from git config. Returns None if not set or looks like an email."""
    try:
        import subprocess
        result = subprocess.run(
            ["git", "config", "--global", "user.name"],
            capture_output=True, text=True, timeout=5,
        )
        name = result.stdout.strip()
        if not name or "@" in name:
            return None
        # First name only — don't leak full name
        first = name.split()[0]
        if first and len(first) > 1:
            return first
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        pass
    return None


# ── Session Index Parsing ───────────────────────────────────────────────────

def discover_agents(agents_dir: Path) -> list[tuple[str, Path, str | None]]:
    """Return list of (agent_key, sessions.json path, display_name or None) for each agent."""
    results = []
    if not agents_dir.is_dir():
        return results

    # Try to find workspace paths from openclaw config
    workspace_map = _load_workspace_map(agents_dir)

    for agent_dir in sorted(agents_dir.iterdir()):
        if not agent_dir.is_dir():
            continue
        index_path = agent_dir / "sessions" / "sessions.json"
        if index_path.is_file():
            display_name = _resolve_agent_name(agent_dir.name, workspace_map)
            results.append((agent_dir.name, index_path, display_name))
    return results


def _load_workspace_map(agents_dir: Path) -> dict[str, Path]:
    """Load agent→workspace mappings from openclaw.json."""
    config_path = agents_dir.parent / "openclaw.json"
    if not config_path.is_file():
        return {}

    try:
        with open(config_path, "r") as f:
            config = json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}

    result = {}
    agents_config = config.get("agents", {})

    # Default workspace applies to all agents unless overridden
    default_ws = agents_config.get("defaults", {}).get("workspace", "")
    if default_ws:
        # Apply default workspace to all agent dirs we find
        for agent_dir in agents_dir.iterdir():
            if agent_dir.is_dir():
                result[agent_dir.name] = Path(default_ws).expanduser()

    # Per-agent workspace overrides
    entries = agents_config.get("entries", {})
    for agent_key, entry in entries.items():
        if isinstance(entry, dict) and entry.get("workspace"):
            result[agent_key] = Path(entry["workspace"]).expanduser()

    return result


def _resolve_agent_name(agent_key: str, workspace_map: dict[str, Path]) -> str | None:
    """
    Try to find a display name for an agent. Priority:
    1. IDENTITY.md in the agent's workspace (parses "Name: ..." line)
    2. None (caller falls back to agent_key)
    """
    workspace = workspace_map.get(agent_key)
    if not workspace:
        return None

    identity_path = workspace / "IDENTITY.md"
    if not identity_path.is_file():
        return None

    try:
        with open(identity_path, "r") as f:
            for line in f:
                # Match patterns like "- **Name:** Clawdius Maximus" or "Name: Foo"
                m = re.match(r"[-*\s]*Name[-*\s]*:\s*\**\s*(.+)", line, re.IGNORECASE)
                if m:
                    name = m.group(1).strip().rstrip("*").strip()
                    if name and name.lower() not in ("", "(not set)", "unknown"):
                        return name
    except OSError:
        pass

    return None


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
    agent_name: str,
    gh_username: str | None = None,
) -> dict | None:
    """
    Aggregate usage messages for one agent into a DailyFactSubmission.
    Returns None if no messages.
    """
    if not messages:
        return None

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

    agent_data = {
        "slug": agent_slug,
        "agentName": agent_name,
        "ownerName": owner_name,
        "state": "live",
        "sourceOfTruth": "skill",
    }
    if gh_username:
        agent_data["primaryGithubUsername"] = gh_username

    return {
        "agent": agent_data,
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

def _get_gh_token() -> str | None:
    """Get the current GitHub auth token from gh CLI."""
    try:
        import subprocess
        result = subprocess.run(
            ["gh", "auth", "token"],
            capture_output=True, text=True, timeout=5,
        )
        token = result.stdout.strip()
        if token and result.returncode == 0:
            return token
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        pass
    return None


CLI_AUTH_PATH = "/api/auth/cli"


def run_setup(endpoint: str, verbose: bool = False) -> str | None:
    """
    Auto-setup: exchange a GitHub token for a ClawRank API token.
    Returns the raw cr_live_ token on success, or None on failure.
    """
    print("▸ ClawRank auto-setup")
    print()

    # Step 1: Get GitHub token from gh CLI
    print("  [1/3] Getting GitHub identity from gh CLI...")
    gh_token = _get_gh_token()
    if not gh_token:
        print("  ✗ Could not get GitHub token. Make sure gh CLI is installed and authenticated.", file=sys.stderr)
        print("    Run: gh auth login", file=sys.stderr)
        return None
    if verbose:
        print(f"    Got GitHub token ({gh_token[:8]}...)")

    # Step 2: Exchange for ClawRank API token
    print("  [2/3] Registering with ClawRank...")
    url = f"{endpoint}{CLI_AUTH_PATH}"
    body = json.dumps({"githubToken": gh_token, "label": "auto-setup"}).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"  ✗ Registration failed: HTTP {e.code}: {error_body}", file=sys.stderr)
        return None
    except urllib.error.URLError as e:
        print(f"  ✗ Connection error: {e.reason}", file=sys.stderr)
        return None

    cr_token = data.get("token")
    user_login = data.get("user", {}).get("login", "?")
    claimed = data.get("claimedAgents", [])

    if not cr_token:
        print(f"  ✗ No token in response: {data}", file=sys.stderr)
        return None

    print(f"    Authenticated as: {user_login}")
    if claimed:
        for a in claimed:
            print(f"    Auto-claimed agent: {a.get('agentName', '?')}")

    # Step 3: Write to openclaw.json skill config
    print("  [3/3] Saving token to OpenClaw config...")
    config_path = Path.home() / ".openclaw" / "openclaw.json"

    try:
        if config_path.is_file():
            with open(config_path, "r") as f:
                config = json.load(f)
        else:
            config = {}

        # Ensure nested structure exists
        config.setdefault("skills", {})
        config["skills"].setdefault("entries", {})
        config["skills"]["entries"].setdefault("clawrank", {})
        config["skills"]["entries"]["clawrank"]["enabled"] = True
        config["skills"]["entries"]["clawrank"].setdefault("env", {})
        config["skills"]["entries"]["clawrank"]["env"]["CLAWRANK_API_TOKEN"] = cr_token

        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)

        print(f"    Token saved to {config_path}")
    except (OSError, json.JSONDecodeError) as e:
        # Config write failed — print manual instructions
        print(f"    ⚠ Could not write config ({e}). Add manually:", file=sys.stderr)
        print(f'    CLAWRANK_API_TOKEN="{cr_token}"', file=sys.stderr)
        # Still return the token so the current run can proceed
        pass

    print()
    print("  ✓ Setup complete! Your agent is now connected to ClawRank.")
    print()
    return cr_token


def main():
    parser = argparse.ArgumentParser(
        description="Ingest OpenClaw session data into ClawRank",
    )
    parser.add_argument("--dry-run", action="store_true", help="Parse and aggregate but don't submit")
    parser.add_argument("--setup", action="store_true", help="Auto-setup: authenticate via GitHub and configure token")
    parser.add_argument("--endpoint", type=str, default=None, help="ClawRank API base URL")
    parser.add_argument("--agents-dir", type=str, default=None, help="Override agents directory")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    args = parser.parse_args()

    endpoint = get_endpoint(args.endpoint)
    token = get_token()
    owner_name = resolve_owner_name()
    agent_name_override = get_agent_name_override()
    gh_username = _get_gh_username()
    agents_dir = get_agents_dir(args.agents_dir)

    # If --setup flag or no token configured, run auto-setup
    if args.setup or (not token and not args.dry_run):
        setup_token = run_setup(endpoint, verbose=args.verbose)
        if setup_token:
            token = setup_token
            # Re-read env in case config changed
            os.environ["CLAWRANK_API_TOKEN"] = setup_token
        elif not args.dry_run:
            print("Setup failed. Run 'gh auth login' first, or set CLAWRANK_API_TOKEN manually.", file=sys.stderr)
            sys.exit(1)

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

    for agent_key, index_path, display_name in agents:
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

        agent_name = agent_name_override or display_name or title_case(agent_key)
        submission = aggregate_to_daily_facts(all_messages, agent_key, owner_name, agent_name, gh_username)
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
