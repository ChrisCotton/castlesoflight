# Design System: Castles of Light UI (Elite Enterprise)
**Project ID:** 14330096793081647070

## 1. Visual Theme & Atmosphere
The atmosphere is "Elite Enterprise" — projecting authoritative security, stability, and high-end technical rigor. It moves away from flashy hacker/cyberpunk aesthetics towards a clean, deeply professional Vault-like environment. The UI feels substantive, highly focused, and bulletproof, employing soft glassmorphism against deep oceanic backdrops.

## 2. Color Palette & Roles
* **Midnight Deep Surface** (`#090E17`): Used for the absolute void background.
* **Slate Navy Base** (`#0F172A`): The primary structural color, used for cards, sidebars, and containers. It provides a subtle elevation from the void.
* **Muted Burnt Orange / Amber** (`#D97736`): The primary brand accent. Used for critical Call-To-Action buttons, active states, and highlighting key data points. It replaces flashy cyans and AI purples.
* **Oceanic Steel Blue** (`#1E293B`): Used for secondary elements, borders, and input backgrounds to provide depth without high contrast.
* **Soft Frost White** (`#F8FAFC`): The primary foreground text color. Softened to reduce eye strain against dark surfaces.
* **Muted Silver** (`#94A3B8`): Used for secondary text, labels, and less prominent data.

## 3. Typography Rules
* **Headers & Impact Text:** Features perfectly tracked, clean sans-serif typography (`Inter` or `Space Grotesk`) designed to look sturdy and trustworthy. Medium to Semibold weights are preferred.
* **Body & Data Typography:** Highly legible `Inter` for standard UI text, prioritizing dense data readability without feeling cluttered.
* **Monospace Data / Status:** Minimal use of `JetBrains Mono` for exact figures or tags, but keeping it restrained to avoid an overly "terminal" look.

## 4. Component Stylings
* **Buttons:** 
  - Primary: Solid Muted Burnt Orange fill with Soft Frost White text. Corners are moderately rounded standard standard (`0.375rem` / `6px`) to feel structured.
  - Ghost/Secondary: Borderless with subtle oceanic blue backgrounds on hover.
* **Cards/Containers:** 
  - Glass-like panels resting on the Midnight surface. 
  - They feature a standard `8px` (`0.5rem`) border radius, filled with Slate Navy (`#0F172A`).
  - Outline borders are extremely subtle (1px of Oceanic Steel Blue at low opacity) to define edges.
* **Inputs/Forms:** 
  - Subtle indented or darkened Slate Navy fields, activating with a Burnt Orange micro-glow ring on focus.

## 5. Layout Principles
* **Whitespace Strategy:** Structured, airy padding. Data should breathe. Cards feature generous internal padding (`1.5rem` to `2rem`).
* **Alignment:** Strict left alignment for data headers. Asymmetrical focus is acceptable for dashboards, but alignment must always trace strict vertical rhythms.
* **Depth & Elevation:** We avoid heavy drop shadows in favor of subtle background lightening and 1px top inner-borders (glass inner light) to give components weight and presence.
