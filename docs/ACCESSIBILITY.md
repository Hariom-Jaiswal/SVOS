# SVOS Accessibility & Inclusive Design Manifest

SVOS is committed to providing a safe, navigable environment for all attendees, regardless of their physical or cognitive abilities.

## 1. Compliance Standard
SVOS targets **WCAG 2.1 AA** compliance as a baseline for all UI components.

## 2. Implementation Strategy

### 🔋 Screen Reader Optimization
- **Assertive Announcements**: Critical congestion nudges use `aria-live="assertive"` and `role="alert"` to ensure immediate interruption by screen readers.
- **Semantic Landscapes**: Every page utilizes HTML5 sections (`<main>`, `<nav>`, `<header>`) to allow for rapid landmark navigation.
- **Informative Labels**: Every interactive icon (Close, Send, Tab switches) includes a hidden `span` with `.sr-only` text or a definitive `aria-label`.

### ⌨️ Keyboard & Focus Logic
- **Focus Trapping**: Toggling the AI Assistant chat modal captures focus and traps it within the dialog until dismissed.
- **Shortcuts**: The `Escape` key is globally bound to close the AI assistant and dismiss non-critical notifications.
- **Visible Focus**: Custom high-contrast focus rings are applied to all interactive elements to assist users with motor impairments or low vision.

### 🎨 Visual Accessibility
- **Contrast**: The SVOS "Uber-style" monochromatic theme uses black (`#000000`) and light gray (`#f6f6f6`) to ensure extreme text contrast ratios (well above the 4.5:1 requirement).
- **Redundancy**: Critical risks are never indicated by color alone; they are always accompanied by icon indicators (e.g., `⚠️`) and descriptive text labels (e.g., `CRITICAL`).
