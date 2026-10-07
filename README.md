# interval.

A lightweight musical interval quiz for bass players. Built with plain HTML, CSS, and JavaScript—no build step or dependencies.

## Run

Open `index.html` in a browser, or serve this directory:

```sh
python3 -m http.server 8000
```

Then visit **http://localhost:8000**. Use the same address each time to keep your saved progress.

## Practice

- Click the 🇬🇧 or 🇧🇷 flag under **LANGUAGE** in the settings pane to choose English or Brazilian Portuguese. Your language is saved, and switching preserves the current question, revealed answer, and score. Note letters (C, D, E, etc.) remain unchanged in both languages.
- Choose any combination of the 11 intervals. The default is minor and major 3rds, perfect 5ths, and minor and major 7ths.
- Questions ask for the note **above** the root. Select an answer, then advance with **Next question**.
- Under **NEXT QUESTION**, choose **Manual** (the default) or **Countdown**. Countdown replaces the button with a visible timer and advances automatically 3, 5, or 10 seconds after each answer. Switching to Manual cancels the timer; changing its duration starts a fresh countdown. Language changes preserve the remaining time. Your mode and delay are saved.
- Answer using the buttons or keys `1`–`9`, `0`, `-`, and `=` (matching the buttons from left to right).
- Each answer option shows one interval-aware spelling based on the root, rather than a combined sharp/flat label. For example, C’s minor second is D♭, while D’s major seventh is C♯. The tritone uses the augmented-fourth spelling. The revealed target matches the option; unusual spellings also show a familiar equivalent in the feedback.
- The circle of fifths highlights the root, then connects it to the revealed target.
- Switch between standard-tuned 4-string (E–A–D–G), 5-string (B–E–A–D–G), and 6-string (B–E–A–D–G–C) basses.
- The fretboard shows frets 0–12 and highlights visible root and target positions. On small screens, scroll the fretboard horizontally.
- View accuracy, correct answers, current streak, average answer time, and per-interval results. Answer time runs from when a question appears until the answer is submitted; review time and countdown delays are excluded. Older answers without timing data are not included in the average. Reset clears statistics, including timing, while preserving your practice settings.

Settings and statistics stay in your browser’s `localStorage`; nothing is sent to a server. If storage is unavailable, practice still works for the current session. Google Fonts are optional; system-font fallbacks work offline.

## Files

- `index.html` — accessible page structure
- `styles.css` — responsive interface
- `app.js` — question generation, music theory, visualizations, and saved statistics
- `i18n.js` — English and Brazilian Portuguese translations
- `tests/i18n.test.cjs` — dependency-free translation tests
- `tests/music-theory.test.cjs` — answer spelling and button-label tests
- `tests/countdown.test.cjs` — countdown lifecycle and preference tests
- `tests/answer-time.test.cjs` — elapsed time, averages, persistence, and migration tests

## Verification

Run all tests with `node --test tests/*.test.cjs`.

Answer-time tests check averaging, duplicate-answer protection, exclusion of countdown delays, localization, legacy-score migration, saved timing validation, and reset.

Countdown tests use deterministic timers to check manual mode, timing, duplicate-answer protection, cancellation, delay changes, language changes, and saved preference validation. Browser checks also verify automatic advancement, preference persistence, and responsive layout.

Language switching was browser-tested before and after answers, including preservation of feedback, scores, and the expanded statistics panel; language persistence; translated reset prompts; and both languages at widths from 320px to 1440px.

Browser-tested scoring, duplicate-answer protection, reset confirmation, settings persistence, keyboard controls, and interval selection. Checked all **396 combinations** (12 roots × 11 intervals × 3 string counts) and responsive widths from 320px to 1440px.
