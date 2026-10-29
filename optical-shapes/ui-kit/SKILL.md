---
name: extrude-that-ui
description: Extrude That's own UI system — type, tokens, surfaces, components, interactions and the icon set (style, sizes, inventory). Use for any UI or icon work in this repo, on top of baseline-ui.
---

# Extrude That UI

The house rules for this app's interface. `baseline-ui` still applies; this
skill adds what is specific to Extrude That. When the two disagree, this one
wins. `HANDOFF.md` at the repo root is the long-form, human version.

## How to use

- `/extrude-that-ui` — apply these rules to any UI work in this conversation.
- `/extrude-that-ui <file>` — review the file against them: quote each
  violation, say why in one sentence, give the code-level fix.

## Layout

- Grid: canvas (viewport) on the left, sidebar on the right (`md:` and up);
  on small screens the sidebar stacks under the canvas with `border-t`.
- Sidebar: header `h-12` (mark, title, Export SVG primary button) → scrolling
  body `px-4 pt-3 pb-4 gap-7` with sections Text, Extrusion, Layers → footer
  with the Upload SVG button (`h-10 w-full rounded-xl`).
- Viewport overlays float over the canvas: tool rail (left), zoom/view bar,
  paint bar, tool hints (bottom center).
- Root is 100% tall (`h-full`), never `h-screen`.
- Separate with space, not lines. The only rules are the sidebar's outer
  borders, its footer `border-t`, and the `h-px w-5` dividers between tool
  groups in the rail.

## Type

- One size: 12px. `type-body-sm` / `text-xs` everywhere; `type-code` (JetBrains
  Mono) for keys (`<kbd>`) and hex values.
- Hierarchy is weight + color, never size. The more important text is one
  weight above the body (medium over regular, bold over medium) and in
  `content-primary` over the body's `content-secondary`.
  - Section titles: `type-h2 text-content-primary` (12px, 500).
  - Labels: `type-body-sm text-content-secondary`.
  - Notes, units, empty states: `text-content-muted`.
- `tabular-nums` on every number that changes (fields, %, px, degrees).
- Fonts: Inter (UI), JetBrains Mono (code). The artwork's fonts are separate.

## Color tokens (`src/index.css`)

| Token | Use |
| --- | --- |
| `page-default` | page behind everything |
| `surface-default` | sidebar, popovers, floating bars |
| `surface-subtle` | canvas background, thumbnails |
| `fill-default` / `fill-subtle` / `fill-strong` | inputs, secondary buttons, hovers, segmented track |
| `fill-inverse` + `content-inverse` | primary button |
| `content-primary` / `secondary` / `muted` / `extra-muted` | text and icons, strongest to weakest |
| `content-accent` | the one accent — see below |
| `line-default` | rings and the few borders |

- Always tokens, never raw colors. Exceptions: canvas artwork colors in
  `render.ts`, and Blender's axis colors on the rotate gizmo (X `#ff3352`,
  Y `#8bdc00`, Z `#2890ff`).
- `content-accent` only for canvas editing feedback and focus: distort,
  transform and gradient handles, snap guides, the text caret and selection,
  focus rings (`focus-visible:outline-2 outline-content-accent`), the layer
  drop line and the file drop target. Chrome never gets it — not even the
  active tool, which is the pressed Segmented item.
- Dark mode follows the OS unless `data-theme` is pinned on the root; every
  token has a dark value. No gradients in the UI (the gradient *fill* of the
  artwork is content, not chrome).

## Surfaces and z-index

- Floating surface: `rounded-xl bg-surface-default ring-1 ring-line-default shadow-2xs`
  (popover padding `p-3`, rail `p-1`, hint `px-3 py-1.5 rounded-lg`).
- `z-10` viewport overlays, `z-20` popovers. Nothing else.
- Popovers are Base UI `Popover` (`Positioner side="top" sideOffset={8}`),
  each with an `sr-only` `Popover.Title`.

## Components (`src/components/ui/`)

- `Button` — variants `primary` (inverse), `secondary` (fill + ring), `ghost`;
  sizes `md` h-8, `sm` h-7, `icon` size-7; `text-xs font-medium`; icons 16px.
- `Segmented` — Base UI ToggleGroup; track `bg-fill-strong p-0.5 rounded-lg`,
  pressed item `bg-surface-default text-content-primary shadow-xs`. Used for the
  tool rail (vertical, `size-8` items), Fill/Gradient tabs, view modes, align.
- `ScrubField` — number field you can drag on its icon/label to scrub; icon
  prefix in `text-content-muted`, unit suffix muted.
- `SliderField`, `SwitchField`, `SelectField`, `FontPicker` (Combobox, pass
  only the filtered items), `ColorPicker` (modes + eyedropper).
- Layer rows: thumbnail (`rounded-md bg-surface-subtle ring-1`), name
  (truncate with …), then always-visible icon buttons in this order:
  **eye, lock, bin** (`size-6 rounded-md`, muted until on/hovered).
- Anything with keyboard or focus behavior is Base UI, never a hand-rolled div.
- Icon-only controls always carry `aria-label` (and a `title` with the
  shortcut when there is one).

## Interaction rules

- Tools (left rail, top to bottom): Select (V), Text (T), Rotate, Perspective,
  Free distort | Reset, Undo, Redo | Extruded points (kept at the bottom).
- Select: click artwork → select layer + transform box (corners scale, Alt
  from center; sides scale from center; drag inside moves). Double-click a
  text → edit it. Move/scale always snaps (guides drawn in the viewport).
- Pan: hold the middle mouse button and drag (hand cursor only then); on touch,
  drag on empty canvas. There is no hand tool in the rail.
- Rotate: Blender-style gizmo, drag a ring to turn about its axis, rim to roll,
  inside to turn freely; X/Y/Z scrub fields in the tool hint.
- Gradient editor stays open while its handles are dragged on the canvas
  (outside presses on `[data-gradient-handle]` are ignored).
- No animation unless asked; existing transitions are 150ms color/opacity only.

## Icons (`src/components/ui/icons.tsx`)

Style — every icon spreads the shared `base`:

```tsx
const base = {
  width: 16, height: 16, viewBox: "0 0 16 16",
  fill: "none", stroke: "currentColor", strokeWidth: 1.5,
  strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
} as const;
```

- Draw on the 16-unit grid, keep ~2.5 units of padding, outline only
  (`fill="currentColor"` only where the meaning is "filled", e.g. SolidFill),
  `opacity` for secondary strokes. Color always comes from `currentColor`.
- One `/** … */` line above each icon saying what it depicts and means.
- Name `<Thing>Icon`, export from `icons.tsx`; no icon libraries.
- The app mark (`MarkIcon`) is the only one on a 20-unit grid.

Sizes:

| Where | Size |
| --- | --- |
| Default (Button, Segmented, layer rows, fields) | 16px — `[&_svg]:size-4` |
| **SVG icon on the Upload SVG button** | **12px — 4px under the default** (`[&_svg]:size-3` on that button) |
| App mark in the header | 20px — `size-5` |

When the owner asks for an icon to be "N px smaller/bigger", change it on
that one usage via `[&_svg]:size-*`, never in `base`, and add the row above.

Inventory:

| Icon | Meaning | Used in |
| --- | --- | --- |
| MarkIcon | app mark | sidebar header |
| UploadIcon | upload SVG / font | sidebar footer (12px), text source |
| DownloadIcon | export SVG | sidebar header |
| PointerIcon | select tool | tool rail |
| TextIcon | text tool | tool rail |
| RotateIcon | rotate tool (gizmo) | tool rail |
| PerspectiveIcon | perspective distort | tool rail |
| FreeDistortIcon | free distort | tool rail |
| PointsIcon | extruded points | tool rail |
| ResetIcon | reset | tool rail, slider/paint fields |
| UndoIcon / RedoIcon | history | tool rail |
| PlusIcon / MinusIcon | add, zoom, stops | viewport, layers, gradient |
| FitIcon | fit to view | viewport |
| InstanceIcon | show instance | viewport |
| SolidIcon / WireframeIcon / XrayIcon | view modes | viewport |
| SettingsIcon | settings popover | viewport, stroke |
| AlignLeft/Center/RightIcon | text align | text settings |
| LineHeightIcon / LetterSpacingIcon | text metrics | text settings |
| StrokeWidthIcon | stroke width | paint bar |
| JoinMiter/Round/BevelIcon, AngleIcon | stroke joins, miter angle | stroke settings |
| SolidFillIcon / GradientFillIcon | fill / gradient tabs | paint bar |
| FlipIcon / RotateQuarterIcon | flip, rotate 90° | gradient editor |
| EyedropperIcon | pick color | color picker |
| ChevronDownIcon | opens a list | selects, pickers |
| CheckIcon | selected item | selects, pickers |
| EyeIcon / EyeOffIcon | visible / hidden | layer rows |
| LockIcon / UnlockIcon | locked / unlocked | layer rows |
| TrashIcon | delete layer | layer rows |

Keep this table in sync when adding, removing or resizing an icon.
