---
version: alpha
name: Dribbble Clean Canvas
description: A bright, airy creator marketplace system with bold ink text, soft pink accents, and pill-shaped controls.
colors:
  primary: "#0D0C22"
  secondary: "#6E6D7A"
  tertiary: "#EA4C89"
  neutral: "#F7F7FB"
  surface: "#FFFFFF"
  on-surface: "#0D0C22"
  muted-surface: "#F3F3F6"
  border: "#E7E7E9"
  border-strong: "#E5E7EB"
  accent: "#FFECF3"
  error: "#E5484D"
typography:
  headline-display:
    fontFamily: Mona Sans
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: 0px
  headline-lg:
    fontFamily: Mona Sans
    fontSize: 35px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0px
  headline-md:
    fontFamily: Mona Sans
    fontSize: 26px
    fontWeight: 400
    lineHeight: 1.19
    letterSpacing: 0px
  headline-sm:
    fontFamily: Mona Sans
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.21
    letterSpacing: 0px
  body-lg:
    fontFamily: Mona Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  body-md:
    fontFamily: Mona Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.64
    letterSpacing: 0px
  body-sm:
    fontFamily: Mona Sans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.54
    letterSpacing: 0px
  label-lg:
    fontFamily: Mona Sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0px
  label-md:
    fontFamily: Mona Sans
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0px
  label-sm:
    fontFamily: Mona Sans
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0px
  caption:
    fontFamily: Mona Sans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 36px
  gutter: 24px
  section: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 10px 20px
    height: 40px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 10px 20px
    height: 40px
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: 0px
  input:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: 12px 20px
    height: 40px
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 8px 12px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 16px
  banner:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 12px 20px
---

# Dribbble Clean Canvas

## Overview
Dribbble feels bright, editorial, and creator-first, with a strong balance between playful showcase energy and polished marketplace utility. The interface is spacious and breathable, designed to let visual work dominate while keeping navigation and actions lightweight. The tone is modern and approachable, with soft pink accents and bold ink text creating a recognizable, high-contrast brand voice.

## Colors
- **Primary (#0D0C22):** The deep ink used for headlines, nav text, primary buttons, and core UI emphasis. It gives the system its authoritative, premium contrast against white surfaces.
- **Secondary (#6E6D7A):** A muted violet-gray for supporting text, iconography, and less prominent controls. It softens the hierarchy without losing legibility.
- **Tertiary (#EA4C89):** The signature pink accent used for emphasis, active states, links, and highlighted phrases. It supplies energy and brand recognition.
- **Neutral (#F7F7FB):** A very light cool background tint that works for inputs, quiet panels, and subtle separation from pure white.
- **Surface (#FFFFFF):** The main canvas color for pages, cards, buttons, and content blocks. Most of the UI relies on this crisp base for clarity.
- **Muted Surface (#F3F3F6):** A pale gray-lavender used for soft containers and inactive controls when a low-contrast fill is needed.
- **Border (#E7E7E9):** A delicate divider color for secondary buttons, chips, and surface boundaries.
- **Border Strong (#E5E7EB):** A slightly firmer neutral border used where structure matters more than softness.
- **Accent (#FFECF3):** A blush-toned background for banners and promotional surfaces, keeping calls to action friendly and airy.
- **Error (#E5484D):** Reserved for destructive or invalid states; it should stay rare and highly noticeable.

## Typography
Mona Sans is the dominant family across the interface, supported by a pragmatic sans-serif fallback stack. Headlines are clean and restrained rather than dramatic: `headline-display` at 48px/600 anchors hero messaging, while `headline-lg`, `headline-md`, and `headline-sm` provide a descending editorial rhythm with lighter weights. Body text stays compact and readable at 14px–16px, and labels are set in semibold weights for buttons, tabs, chips, and filters. Letter spacing is neutral and there is no visible uppercase-driven tracking system, which keeps the brand feeling modern and unfussy.

## Layout
The layout is fluid and wide, with generous horizontal breathing room and a content structure that feels centered on a large desktop canvas. Sections use a clear rhythm built from 12px, 16px, 20px, and 36px increments, with larger section spacing reserved for major breaks and marketing blocks. Cards and search/filter regions rely on strong alignment and comfortable internal padding rather than dense grids. Controls are spaced apart enough to preserve a premium, uncluttered feel, while pill chips and banners use compact padding to maintain visual lightness.

## Elevation & Depth
The system is intentionally low-elevation and mostly flat. Depth comes from contrast, thin borders, and occasional soft shadows rather than heavy stacking or dramatic blur. Secondary buttons and cards may use subtle shadowing to lift them slightly from the page, but the overall hierarchy depends more on tonal separation and whitespace than on pronounced depth.

## Shapes
The shape language is soft and highly rounded, with full-pill radii dominating interactive elements. Buttons, chips, search fields, and banners lean into `rounded.full`, creating a friendly, modern marketplace feel. Cards keep a modest `rounded.md` radius so content containers feel structured without becoming rigid. Overall, the system reads as smooth, approachable, and consumer-facing.

## Components
Buttons are pill-shaped, compact, and strongly typed. `button-primary` uses the deep ink background with white text, semibold 13px labels, 10px 20px padding, and a 40px height for confident primary actions. `button-secondary` inverts that treatment with a white surface and subtle border, useful for quiet alternatives and utility actions. `button-tertiary` is text-only and should be used sparingly for links or low-importance actions. Hover and active states should preserve the same shape language, with color shifts kept subtle rather than animated or flashy.

Cards are white, bordered, and lightly padded. `card` should feel like a clean content frame with 16px padding, 8px radius, and minimal shadow usage. Inputs follow the same rounded pill language as buttons: `input` uses a soft neutral fill, 12px 20px padding, and a 40px height, creating a friendly search-field feel. Chips are small rounded filters with restrained color contrast; they should remain legible but visually subordinate to primary actions. Banners use the soft blush `banner` treatment to announce promotions without overpowering the page. Lists and filter rows should stay sparse, aligned, and evenly spaced, with iconography kept simple and consistent in weight. Tooltips, checkboxes, and radio controls—when needed—should borrow the same soft borders, neutral fills, and semibold labels rather than introducing new visual patterns.

## Do's and Don'ts
- Do use Mona Sans everywhere to maintain a cohesive product and marketing voice.
- Do keep major actions pill-shaped and semibold, with the primary action always clearly darker than surrounding controls.
- Do preserve ample whitespace around heroes, search areas, and content grids so the page feels curated, not crowded.
- Do use soft pink only as an accent for emphasis, active states, or promotional moments.
- Don't introduce heavy shadows or deep card stacks that would fight the flat, airy aesthetic.
- Don't replace rounded pills with sharp corners on buttons, chips, or search inputs.
- Don't overuse uppercase text or tight tracking; the system reads best in sentence case and clean labels.
- Don't let secondary text compete with the primary ink and pink hierarchy; keep support content muted and calm.