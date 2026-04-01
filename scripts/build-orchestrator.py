#!/usr/bin/env python3
"""
OnlyKrida MVP Build Orchestrator
Spawns parallel Claude agents to complete Wave 2 tasks autonomously.

Prerequisites:
    pip install claude-agent-sdk

Usage:
    python scripts/build-orchestrator.py              # Run all tasks
    python scripts/build-orchestrator.py --task 2a    # Run specific task
    python scripts/build-orchestrator.py --dry-run    # Preview tasks without running
"""

import anyio
import argparse
import sys
from datetime import datetime
from claude_agent_sdk import (
    query,
    ClaudeAgentOptions,
    AgentDefinition,
    ResultMessage,
    AssistantMessage,
    SystemMessage,
    CLINotFoundError,
    CLIConnectionError,
    ProcessError,
)

PROJECT_DIR = "/Users/anirudhtumuluru/onlysports-platform"

# Shared system prompt that all agents get — tells them about the project
SYSTEM_PROMPT = """You are working on OnlyKrida, a React Native (Expo SDK 54) sports networking app.

CRITICAL: Read docs/MVP_BUILD_PLAN.md and CLAUDE.md before starting any work.

Key rules:
- Use TypeScript strict mode
- Use theme constants from constants/theme.ts (never hardcode colors)
- Use @/ path aliases
- Follow the createContextHook pattern from @nkzw/create-context-hook
- Run `npx tsc --noEmit` after changes to verify no errors
- Use CachedImage component instead of Image for all avatar/media
- Add FlatList perf props: maxToRenderPerBatch={8} windowSize={5} initialNumToRender={10}
"""

# Each task is a dict with id, name, prompt, and tools
TASKS = {
    "2a": {
        "name": "CachedImage Migration",
        "prompt": """Complete the CachedImage migration across ALL screens.

Read docs/MVP_BUILD_PLAN.md section 2A for the full list of files.

For each file:
1. Add `import CachedImage from '@/components/CachedImage';`
2. Remove `Image` from react-native imports if no longer needed
3. Replace all `<Image source={{ uri: ... }}>` with `<CachedImage source={...} size={N} placeholder="avatar" />`
4. Remove all via.placeholder.com URLs

Files to update: chat/[id].tsx, chat/group/[id].tsx, notifications.tsx, profile.tsx, user/[id].tsx,
AthleteHome.tsx, ScoutHome.tsx, CoachHome.tsx, TeamHome.tsx, BrandHome.tsx, FanHome.tsx,
CommentsModal.tsx, VideoPlayer.tsx

After all changes, run: npx tsc --noEmit""",
        "tools": ["Read", "Edit", "Write", "Glob", "Grep", "Bash"],
    },
    "2b": {
        "name": "Discover Screen useReducer",
        "prompt": """Rewrite app/(tabs)/discover.tsx to use useReducer instead of 17 separate useState hooks.

Read docs/MVP_BUILD_PLAN.md section 2B for the state interface and action types.

Steps:
1. Read the current discover.tsx fully
2. Define DiscoverState interface and DiscoverAction type union
3. Create discoverReducer function
4. Replace all 17 useState calls (lines 31-47) with single useReducer
5. Update all setState calls to dispatch calls
6. Keep ALL existing functionality identical
7. Run: npx tsc --noEmit""",
        "tools": ["Read", "Edit", "Bash", "Grep"],
    },
    "2c": {
        "name": "FlatList Performance Props",
        "prompt": """Add FlatList performance props to ALL remaining FlatList instances.

Read docs/MVP_BUILD_PLAN.md section 2C.

For every FlatList in the project (use Grep to find them all), add these props if not already present:
- maxToRenderPerBatch={8}
- windowSize={5}
- initialNumToRender={10}
- removeClippedSubviews={Platform.OS === 'android'}

Also: ensure all renderItem callbacks are wrapped in useCallback.
Also: replace any inline ItemSeparatorComponent arrow functions with stable references.

After all changes, run: npx tsc --noEmit""",
        "tools": ["Read", "Edit", "Glob", "Grep", "Bash"],
    },
    "2d": {
        "name": "Component Refactoring",
        "prompt": """Break down the monolithic home components into sub-components.

Read docs/MVP_BUILD_PLAN.md section 2D for the full plan.

Start with AthleteHome.tsx (666 lines) — the largest:
1. Read components/home/AthleteHome.tsx fully
2. Create components/home/athlete/ directory
3. Extract: AthleteHeader.tsx, AthleteFeed.tsx, AthleteQuickActions.tsx, OpportunityPreview.tsx, CoachSuggestions.tsx
4. Rewrite AthleteHome.tsx as a slim orchestrator composing these
5. Wrap extracted components in React.memo
6. Run: npx tsc --noEmit

Then do ScoutHome.tsx and CoachHome.tsx following the same pattern.

Create shared components:
- components/home/shared/SectionHeader.tsx
- components/home/shared/PostCard.tsx
- components/home/shared/UserCard.tsx""",
        "tools": ["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
    },
    "2e": {
        "name": "Skeleton Screens",
        "prompt": """Add missing skeleton loading screens.

Read docs/MVP_BUILD_PLAN.md section 2E and existing components/SkeletonScreens.tsx.

Add these new skeletons to SkeletonScreens.tsx:
- ChatSkeleton — for chat/[id].tsx (message bubbles placeholder)
- UserProfileSkeleton — for user/[id].tsx (cover + avatar + stats + posts grid)
- DiscoverSkeleton — for discover.tsx (search bar + user cards)
- FeedSkeleton — for home screens (post cards)

Then integrate them into the screens — replace ActivityIndicator with the proper skeleton.

After all changes, run: npx tsc --noEmit""",
        "tools": ["Read", "Edit", "Write", "Bash", "Grep"],
    },
    "2f": {
        "name": "Onboarding UX",
        "prompt": """Improve the onboarding/auth flow UX.

Read docs/MVP_BUILD_PLAN.md section 2F.

Changes:
1. role-selection.tsx: Add "Step 1 of 2" progress indicator, change title to something welcoming
2. All signup screens (signup-athlete.tsx, signup-coach.tsx, etc.): Add "Step 2 of 2", split fields into required vs optional with a "Skip for now" button
3. Add encouraging microcopy throughout ("You're almost there!", "Great choice!")
4. Simplify forms: only name, email, password, sport are required for MVP. Everything else is optional.

IMPORTANT: Read /Users/anirudhtumuluru/.claude/projects/-Users-anirudhtumuluru/memory/feedback_never_demotivate.md — never use demotivating language.

After all changes, run: npx tsc --noEmit""",
        "tools": ["Read", "Edit", "Bash", "Grep"],
    },
}


async def run_task(task_id: str, task: dict) -> dict:
    """Run a single build task and return the result."""
    start = datetime.now()
    print(f"\n{'='*60}")
    print(f"  STARTING: [{task_id}] {task['name']}")
    print(f"  Time: {start.strftime('%H:%M:%S')}")
    print(f"{'='*60}\n")

    result = {"task_id": task_id, "name": task["name"], "success": False, "output": ""}

    try:
        async for message in query(
            prompt=task["prompt"],
            options=ClaudeAgentOptions(
                cwd=PROJECT_DIR,
                allowed_tools=task["tools"],
                permission_mode="bypassPermissions",
                system_prompt=SYSTEM_PROMPT,
                max_turns=80,
                setting_sources=["project"],  # Load CLAUDE.md
            ),
        ):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if hasattr(block, "text"):
                        # Print progress snippets
                        text = block.text[:200] if len(block.text) > 200 else block.text
                        print(f"  [{task_id}] {text}")

            if isinstance(message, ResultMessage):
                result["output"] = message.result or ""
                result["success"] = True

    except CLINotFoundError:
        result["output"] = "ERROR: Claude Code CLI not found. Run: pip install claude-agent-sdk"
        print(f"  [{task_id}] {result['output']}")
    except CLIConnectionError as e:
        result["output"] = f"ERROR: Connection failed: {e}"
        print(f"  [{task_id}] {result['output']}")
    except ProcessError as e:
        result["output"] = f"ERROR: Process error: {e}"
        print(f"  [{task_id}] {result['output']}")
    except Exception as e:
        result["output"] = f"ERROR: {type(e).__name__}: {e}"
        print(f"  [{task_id}] {result['output']}")

    elapsed = (datetime.now() - start).total_seconds()
    status = "DONE" if result["success"] else "FAILED"
    print(f"\n  [{task_id}] {status} in {elapsed:.0f}s\n")

    return result


async def run_tasks_parallel(task_ids: list[str]):
    """Run multiple tasks in parallel using anyio task groups."""
    results = []

    async with anyio.create_task_group() as tg:
        async def run_and_collect(tid, task):
            r = await run_task(tid, task)
            results.append(r)

        for tid in task_ids:
            if tid in TASKS:
                tg.start_soon(run_and_collect, tid, TASKS[tid])
            else:
                print(f"WARNING: Unknown task '{tid}', skipping")

    return results


async def run_tasks_sequential(task_ids: list[str]):
    """Run tasks one at a time (safer, less resource-intensive)."""
    results = []
    for tid in task_ids:
        if tid in TASKS:
            r = await run_task(tid, TASKS[tid])
            results.append(r)
            if not r["success"]:
                print(f"\nTask {tid} failed. Continue? (y/n) ", end="", flush=True)
                # In autonomous mode, just continue
        else:
            print(f"WARNING: Unknown task '{tid}', skipping")
    return results


async def main():
    parser = argparse.ArgumentParser(description="OnlyKrida MVP Build Orchestrator")
    parser.add_argument("--task", "-t", nargs="+", help="Specific task IDs to run (e.g., 2a 2b)")
    parser.add_argument("--parallel", "-p", action="store_true", help="Run tasks in parallel")
    parser.add_argument("--dry-run", action="store_true", help="Preview tasks without running")
    parser.add_argument("--all", "-a", action="store_true", help="Run all Wave 2 tasks")
    args = parser.parse_args()

    # Determine which tasks to run
    if args.task:
        task_ids = args.task
    elif args.all:
        task_ids = list(TASKS.keys())
    else:
        # Default: show menu
        print("\nOnlyKrida MVP Build Orchestrator")
        print("=" * 40)
        for tid, task in TASKS.items():
            print(f"  {tid}: {task['name']}")
        print()
        print("Usage:")
        print("  python scripts/build-orchestrator.py --all           # Run all")
        print("  python scripts/build-orchestrator.py --task 2a 2b    # Run specific")
        print("  python scripts/build-orchestrator.py --all --parallel # All in parallel")
        print("  python scripts/build-orchestrator.py --dry-run --all # Preview")
        return

    # Dry run
    if args.dry_run:
        print("\nDRY RUN — would execute these tasks:")
        for tid in task_ids:
            if tid in TASKS:
                t = TASKS[tid]
                print(f"\n  [{tid}] {t['name']}")
                print(f"  Tools: {', '.join(t['tools'])}")
                print(f"  Prompt: {t['prompt'][:100]}...")
        return

    # Execute
    print(f"\nStarting {len(task_ids)} task(s)...")
    print(f"Mode: {'parallel' if args.parallel else 'sequential'}")
    print(f"Project: {PROJECT_DIR}\n")

    start = datetime.now()

    if args.parallel:
        results = await run_tasks_parallel(task_ids)
    else:
        results = await run_tasks_sequential(task_ids)

    # Summary
    elapsed = (datetime.now() - start).total_seconds()
    succeeded = sum(1 for r in results if r["success"])
    failed = len(results) - succeeded

    print("\n" + "=" * 60)
    print("  BUILD SUMMARY")
    print("=" * 60)
    for r in results:
        icon = "OK" if r["success"] else "FAIL"
        print(f"  [{icon}] {r['task_id']}: {r['name']}")
    print(f"\n  Total: {len(results)} | Passed: {succeeded} | Failed: {failed}")
    print(f"  Time: {elapsed:.0f}s")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    anyio.run(main)
