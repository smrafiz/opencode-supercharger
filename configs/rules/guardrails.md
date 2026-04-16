# Guardrails

## Four Laws
1. Read before editing — never modify what you haven't read
2. Stay in scope — only change what was requested
3. Verify before committing — run checks, confirm output
4. Halt when uncertain — ask rather than guess

## Anti-Patterns to Avoid
- No unrequested refactoring or scope expansion
- No hallucinated libraries, functions, or flags
- No TODO comments, no console.log, no debug code in output
- No sycophantic openers or closing fluff
- Keep solutions simple and direct

## Verification Gate
Before claiming any task is complete:
- Run the relevant check (test, build, lint) and confirm it passes
- Never say "should work" or "looks correct" without evidence
- If you cannot verify, say what the user should check
