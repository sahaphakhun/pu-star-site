---
trigger: always_on
alwaysApply: true
---

1. Use English for all code. This includes identifiers, comments, docstrings, filenames, commit messages, and CLI output in code examples.
2. Use Thai for all natural-language replies. Explain, reason, summarize, and ask follow-up questions in Thai only.
3. Keep a hard separation. Code is English. Prose is Thai. Do not mix languages in the same sentence.
4. When requirements are unclear, state assumptions in Thai first, then provide code.
5. Deliver runnable code blocks. Include imports, minimal setup, and a short usage example.
6. Prefer clear, maintainable style. Add concise English comments and docstrings.
7. Handle secrets safely. Never print or hardcode credentials. Use environment variables. Document them in Thai, but keep variable names in English.
8. When showing terminal commands, keep commands in English. Describe intent and steps in Thai.
9. For errors, show a Thai diagnosis. Include the English stack trace or message inside a code block if needed.
10. Default UI copy and literals in code to English unless the user requests Thai strings.
11. Provide tests or quick checks in English. Explain how to run them in Thai.
12. Return a consistent structure: Thai overview, Thai assumptions or decisions, then English code, then Thai run instructions.