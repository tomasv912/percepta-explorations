# Extrude That — UI handoff

What the interface is made of and how to extend it without breaking it. The
same rules, in agent form, live in `.claude/skills/extrude-that-ui/SKILL.md`;
keep both in sync.

## 1. Principles

- Quiet, neutral chrome; the artwork is the only colorful thing on screen.
- One type size (12px). Hierarchy by weight and color, never size.
- One accent, reserved for editing feedback on the canvas and focus.
- Space instead of divider lines. Floating surfaces get a ring and a tiny shadow.
- Everything with keyboard or focus behavior is Base UI.

## 2. Layout

```
┌──────────────────────────────────────────────┬───────────────────────┐
│ ┌──┐                                         │ ◩ Extrude That [Export]│ h-12 header
│ │▶ │ tool rail                               │                       │
│ │T │                                         │ Text                  │
│ │⟳ │            canvas (viewport)            │   font, style, size…  │
│ │▱ │                                         │ Extrusion             │
│ │◇ │                                         │   Y, X, Depth, flip   │
│ │──│                                         │ Layers            [+] │
│ │↺ │                                         │   ▢ Layer 1  👁 🔒 🗑 │
│ │↶ │                                         │                       │
│ │↷ │      [ tool hint / scrub fields ]       ├───────────────────────┤
│ └──┘   [fill][stroke][bg]   [view][zoom]     │ [⇪ Upload SVG]        │ footer
└──────────────────────────────────────────────┴───────────────────────┘
```

- Below `md` the sidebar stacks under the canvas.
- Root is `h-full` from a 100%-tall `html/body/#root`.

## 3. Type

| Role | Class | Weight | Color |
| --- | --- | --- | --- |
| Title (app, sections, popovers) | `type-h2` | 500 | `content-primary` |
| Body, labels | `type-body-sm` / `text-xs` | 400 | `content-secondary` |
| Notes, units, empty states | `type-body-sm` | 400 | `content-muted` |
| Buttons | `text-xs font-medium` | 500 | per variant |
| Keys, hex | `type-code` (JetBrains Mono) | 400 | `content-primary` |

All 12px / 1.5. Numbers that change use `tabular-nums`.

## 4. Color tokens

| Token | Light | Dark |
| --- | --- | --- |
| page-default | #ffffff | #0f0f0f |
| surface-default | #ffffff | #151515 |
| surface-subtle | #f5f5f5 | #1b1b1b |
| fill-default | #ffffff | #151515 |
| fill-subtle | #fafafa | #1c1c1c |
| fill-strong | #f5f5f5 | #242424 |
| fill-inverse | #151515 | #f5f5f5 |
| fill-accent | #e5f0ff | #0f2645 |
| content-primary | #151515 | #ededed |
| content-secondary | #757575 | #a0a0a0 |
| content-muted | #a5a5a5 | #6e6e6e |
| content-extra-muted | #e5e5e5 | #2c2c2c |
| content-inverse | #ffffff | #151515 |
| content-accent | #1f78ff | #4d94ff |
| line-default | #ededed | #262626 |

- Source of truth: `src/index.css`. Use the Tailwind names (`bg-surface-default`,
  `text-content-muted`, `ring-line-default`…), never hex.
- Accent (`content-accent`) only for:
  - handles: transform, distort and gradient;
  - snap guides;
  - the text caret and selection;
  - focus rings;
  - the layer drop line and the file drop target.
- Raw colors allowed only for:
  - the artwork (`render.ts`);
  - Blender's gizmo axes: X #ff3352, Y #8bdc00, Z #2890ff.

## 5. Surfaces, radius, elevation

| Element | Classes |
| --- | --- |
| Floating surface (rail, popovers, bars) | `rounded-xl bg-surface-default ring-1 ring-line-default shadow-2xs` |
| Tool hint | same, `rounded-lg px-3 py-1.5` |
| Button | `rounded-lg`, md `h-8`, sm `h-7`, icon `size-7` |
| Segmented | track `rounded-lg bg-fill-strong p-0.5`, item `rounded-md h-7` |
| Layer row icon button | `size-6 rounded-md` |
| Thumbnail | `rounded-md bg-surface-subtle ring-1 ring-line-default` |

z-index: `z-10` viewport overlays, `z-20` popovers.

## 6. Components

- **Button**:
  - `primary` is the inverse fill: Export SVG.
  - `secondary` is fill + ring: Upload SVG.
  - `ghost` is for icon actions.
- **Segmented** (Base UI ToggleGroup): tool rail (vertical, `size-8` items),
  Fill/Gradient tabs, view modes, text align.
- **ScrubField**: a number input. Drag its icon or label to scrub; the unit
  suffix is muted.
- **SliderField, SwitchField, SelectField, FontPicker** (Combobox), **ColorPicker**
  (modes + eyedropper), **GradientEditor**:
  - always linear;
  - a stops bar and a stops list;
  - Flip and Rotate 90°;
  - its handles live on the canvas while the popover stays open.
- **Layers panel**, one row per layer:
  - a thumbnail, then the name. The name is the text content; otherwise
    "Layer N", truncated with "…".
  - eye, lock and bin buttons, in that order and always visible.
  - Drag a row to reorder; Alt+↑/↓ does the same from the keyboard.
  - The "+" button adds an empty layer.

## 7. Interactions

| Action | Input |
| --- | --- |
| Select tool | V — click artwork to select, transform box: corners scale (Alt from center), sides scale from center, drag inside to move; always snaps |
| Edit text | double-click a text (Select), or Text tool (T) and click |
| New text | Text tool, click empty canvas → new layer |
| Pan | hold the middle mouse button and drag (hand cursor only then); touch: drag empty canvas |
| Rotate | Rotate tool → Blender gizmo: drag a ring to turn on its axis, rim to roll, inside to turn freely; X/Y/Z fields in the hint |
| Instance | S / Tab |
| Undo / Redo | Ctrl/⌘+Z, Ctrl/⌘+Shift+Z or Ctrl+Y |
| Finish / cancel | Esc |

## 8. Icons

All icons are hand-drawn in `src/components/ui/icons.tsx`; there is no icon library.

- **Grid:** a 16×16 viewBox with ~2.5 units of padding. `MarkIcon` is the
  exception, on a 20×20 viewBox.
- **Stroke:** `currentColor`, 1.5 wide, round caps and joins, `fill="none"`.
  Fill only where the meaning is "filled".
- **Accessibility:** `aria-hidden`. The control that holds the icon carries the
  `aria-label`.
- **Docs:** a one-line `/** what it shows: what it means */` comment above each icon.

| Context | Rendered size |
| --- | --- |
| Default (buttons, segmented, rows, fields) | 16px (`[&_svg]:size-4`) |
| SVG icon on the Upload SVG button | **12px** (4px smaller; `[&_svg]:size-3`) |
| App mark | 20px (`size-5`) |

To resize one icon, override it at the usage with `[&_svg]:size-*`. Never
change `base`.

### Inventory

| Group | Icons |
| --- | --- |
| Brand | MarkIcon |
| File | UploadIcon, DownloadIcon |
| Tools | PointerIcon, TextIcon, RotateIcon, PerspectiveIcon, FreeDistortIcon, PointsIcon |
| History | ResetIcon, UndoIcon, RedoIcon |
| View | PlusIcon, MinusIcon, FitIcon, InstanceIcon, SolidIcon, WireframeIcon, XrayIcon, SettingsIcon |
| Text | AlignLeftIcon, AlignCenterIcon, AlignRightIcon, LineHeightIcon, LetterSpacingIcon |
| Paint | SolidFillIcon, GradientFillIcon, StrokeWidthIcon, JoinMiterIcon, JoinRoundIcon, JoinBevelIcon, AngleIcon, EyedropperIcon, FlipIcon, RotateQuarterIcon |
| Lists | ChevronDownIcon, CheckIcon |
| Layers | EyeIcon, EyeOffIcon, LockIcon, UnlockIcon, TrashIcon |

The skill lists where each one is used.

## 9. Checklist for a UI change

1. Tokens only, 12px only, hierarchy by weight and color.
2. Base UI for anything focusable. `aria-label` on icon-only controls.
3. A new icon: drawn on the 16-unit grid, follows `base`, has its comment, and
   is added to the skill's inventory table.
4. No animation unless asked.
5. Run `npm run typecheck && npm test && npm run build`.
