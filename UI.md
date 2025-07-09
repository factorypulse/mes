# UI Design Guidelines

## Overall Vibe
The user interface should embody a clean, minimal, and modern aesthetic, prioritizing usability and visual clarity. The design should feel high-tech and professional, with a focus on simplicity and elegance.

---

## Core Principles

- **Clarity & Simplicity:**
  - Prioritize clear layouts, generous spacing, and intuitive navigation.
  - Avoid unnecessary visual clutter or decorative elements.
  - Use whitespace strategically to create a sense of openness.

- **Consistency:**
  - Use a consistent design language across all components and pages.
  - Leverage the shadcn/ui design system for uniformity in buttons, forms, modals, etc.
  - Maintain consistent iconography using lucide icons.

- **Responsiveness:**
  - Ensure layouts adapt gracefully to all screen sizes, from mobile to desktop.
  - Use Tailwind 4's responsive utilities for breakpoints and spacing.

---

## Visual Style

### 1. **Light and Dark Mode**
- Support both light and dark themes.
- Use subtle, harmonious color palettes for each mode.
- Ensure sufficient contrast for readability and accessibility.
- Allow users to toggle between modes easily (e.g., via a switch in the header or settings).

### 2. **Minimalist**
- Favor essential elements; remove anything non-essential.
- Use simple, readable typography (e.g., Inter, sans-serif).
- Limit the number of colors and font weights.
- Use icons sparingly and only to aid comprehension.

### 3. **Glassmorphism**
- Apply glassmorphism effects to key surfaces (e.g., cards, modals, navigation bars):
  - Use semi-transparent backgrounds with blur effects (e.g., `backdrop-blur` in Tailwind).
  - Layer subtle gradients and soft shadows for depth.
  - Maintain legibility of content over glass surfaces.

### 4. **Bento Concept**
- Organize content into visually distinct, modular blocks ("bento boxes").
- Each block should have clear boundaries, spacing, and purpose.
- Use grid layouts to arrange bento blocks responsively.
- Allow for interactive or animated bento blocks to highlight key actions or data.

---

## Example Components

- **Navigation Bar:**
  - Glassmorphic background, minimal icons, clear active state.
- **Cards/Bento Blocks:**
  - Rounded corners, soft shadows, glassmorphism, clear headings.
- **Buttons:**
  - Consistent sizing, subtle hover/active effects, clear labels.
- **Forms:**
  - Simple fields, clear validation, minimal adornments.

---

## Accessibility
- Ensure all text has sufficient contrast.
- All interactive elements must be keyboard accessible.
- Provide focus states and ARIA labels where appropriate.

---

## Tools & References
- **Design System:** shadcn/ui
- **Icons:** lucide
- **Styling:** Tailwind 4

---

## Inspiration
- [shadcn/ui Examples](https://ui.shadcn.com/examples)
- [Glassmorphism Gallery](https://glassmorphism.com/)
- [Bento Grid Inspiration](https://bento.me/)

---

For any new UI component, refer to these guidelines to ensure a cohesive, modern, and delightful user experience.
