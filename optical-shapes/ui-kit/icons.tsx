import type { ComponentProps } from "react";

type IconProps = ComponentProps<"svg">;

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m3 8.5 3.5 3.5L13 4.5" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 10.5V2.5M4.5 6 8 2.5 11.5 6M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" />
    </svg>
  );
}

/** App mark: a flat shape with its extruded copy behind it. */
export function MarkIcon(props: IconProps) {
  return (
    <svg {...base} viewBox="0 0 20 20" {...props}>
      <path d="M7 3h10v10H7z" opacity=".45" />
      <path d="M3 7h10v10H3zM3 7l4-4M13 7l4-4M13 17l4-4" />
    </svg>
  );
}

/** Trapezoid: a quad pulled toward a vanishing point. */
export function PerspectiveIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 3.5h6l2.5 9h-11z" />
    </svg>
  );
}

/** Irregular quad: corners moved independently. */
export function FreeDistortIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 4.5 12.5 2.5 13.5 12 4.5 13.5z" />
    </svg>
  );
}

export function ResetIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.8M2.75 2.5v2.75H5.5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 8h9" />
    </svg>
  );
}

export function FitIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 5.5v-3h3M10.5 2.5h3v3M13.5 10.5v3h-3M5.5 13.5h-3v-3" />
    </svg>
  );
}

/** A path with its vertices marked. */
export function PointsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 12.5 6 4l6.5 2-1 6.5z" opacity=".5" />
      <circle cx="3.5" cy="12.5" r="1.5" fill="currentColor" />
      <circle cx="6" cy="4" r="1.5" fill="currentColor" />
      <circle cx="12.5" cy="6" r="1.5" fill="currentColor" />
      <circle cx="11.5" cy="12.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** An arrow orbiting a flat card: spin in depth. */
export function RotateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 3.5v9M9.5 3.5v9" opacity=".5" />
      <path d="M13 6.5c.6.4 1 .95 1 1.5 0 1.66-2.7 3-6 3s-6-1.34-6-3 2.7-3 6-3c.35 0 .7.02 1.03.05" />
      <path d="M8.5 3.6 10 5.1 8.5 6.6" />
    </svg>
  );
}

/** Two stacked outlines: the artwork and its copy behind it. */
export function InstanceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 2.5h8v8h-8z" strokeDasharray="1.5 1.5" />
      <path d="M2.5 5.5h8v8h-8z" />
    </svg>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 3.5 2.5 6.5l3 3M2.5 6.5h7a4 4 0 0 1 0 8h-2" />
    </svg>
  );
}

export function RedoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m10.5 3.5 3 3-3 3M13.5 6.5h-7a4 4 0 0 0 0 8h2" />
    </svg>
  );
}

/** A filled block, its three faces in different tones: solid faces. */
export function SolidIcon(props: IconProps) {
  return (
    <svg {...base} {...props} stroke="none">
      <path d="M8 1.75 14 5 8 8.25 2 5z" fill="currentColor" fillOpacity=".45" />
      <path d="M2 5.75 7.5 8.75v5.5L2 11.25z" fill="currentColor" />
      <path d="M14 5.75 8.5 8.75v5.5l5.5-3z" fill="currentColor" fillOpacity=".75" />
    </svg>
  );
}

/** A see-through box: front and back squares joined at the corners, edges only. */
export function WireframeIcon(props: IconProps) {
  return (
    <svg {...base} {...props} strokeWidth={1.25}>
      <path d="M2.5 5.5h8v8h-8zM5.5 2.5h8v8h-8zM2.5 5.5l3-3M10.5 5.5l3-3M10.5 13.5l3-3M2.5 13.5l3-3" />
    </svg>
  );
}

/** An eye with a dashed pupil: show the edges that are hidden behind. */
export function XrayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2.25" strokeDasharray="1.4 1.2" />
    </svg>
  );
}

export function TextIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 4V2.5h9V4M8 2.5v11M6 13.5h4" />
    </svg>
  );
}

/** Two sliders: settings. */
export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 5h1.25M7.25 5h6.25M2.5 11h6.25M12.25 11h1.25" />
      <circle cx="5.5" cy="5" r="1.75" />
      <circle cx="10.5" cy="11" r="1.75" />
    </svg>
  );
}

export function AlignLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 4h11M2.5 8h7M2.5 12h9" />
    </svg>
  );
}

export function AlignCenterIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 4h11M4.5 8h7M3.5 12h9" />
    </svg>
  );
}

export function AlignRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 4h11M6.5 8h7M4.5 12h9" />
    </svg>
  );
}

/** An A between two rules: the distance between lines. */
export function LineHeightIcon(props: IconProps) {
  return (
    <svg {...base} {...props} strokeWidth={1.25}>
      <path d="M2.5 2.5h11M2.5 13.5h11M5.5 11.5 8 4.5l2.5 7M6.4 9.2h3.2" />
    </svg>
  );
}

/** An A between two bars: the space between letters. */
export function LetterSpacingIcon(props: IconProps) {
  return (
    <svg {...base} {...props} strokeWidth={1.25}>
      <path d="M2.5 3v10M13.5 3v10M5.5 11.5 8 4.5l2.5 7M6.4 9.2h3.2" />
    </svg>
  );
}

/** Three lines of growing weight: stroke width. */
export function StrokeWidthIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 4h11" strokeWidth={1} />
      <path d="M2.5 8h11" strokeWidth={1.75} />
      <path d="M2.5 12.25h11" strokeWidth={2.5} />
    </svg>
  );
}

/** A sharp corner: mitered join. */
export function JoinMiterIcon(props: IconProps) {
  return (
    <svg {...base} {...props} strokeLinejoin="miter" strokeLinecap="butt">
      <path d="M3 13.5V3h10.5" />
      <path d="M6 13.5V6h7.5" strokeOpacity=".45" />
    </svg>
  );
}

/** A rounded corner: round join. */
export function JoinRoundIcon(props: IconProps) {
  return (
    <svg {...base} {...props} strokeLinecap="butt">
      <path d="M3 13.5V8a5 5 0 0 1 5-5h5.5" />
      <path d="M6 13.5V8a2 2 0 0 1 2-2h5.5" strokeOpacity=".45" />
    </svg>
  );
}

/** A cut corner: beveled join. */
export function JoinBevelIcon(props: IconProps) {
  return (
    <svg {...base} {...props} strokeLinejoin="miter" strokeLinecap="butt">
      <path d="M3 13.5V7l4-4h6.5" />
      <path d="M6 13.5V8.2L8.2 6h5.3" strokeOpacity=".45" />
    </svg>
  );
}

/** Two rays and an arc: an angle. */
export function AngleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 3v10h10" />
      <path d="M3 8.5a4.5 4.5 0 0 1 4.5 4.5" strokeWidth={1.25} />
    </svg>
  );
}

/** A chevron pointing down: opens a list. */
export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

/** An eyedropper: pick a color from the screen. */
export function EyedropperIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9.5 4.5 2 2M10.75 2.25a1.77 1.77 0 0 1 2.5 2.5L11.5 6.5l-2-2zM9.5 4.5 3.5 10.5 3 13l2.5-.5 6-6" />
    </svg>
  );
}

/** A bin: delete. */
export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5M7 7v4M9 7v4" />
    </svg>
  );
}

/** A closed padlock: locked. */
export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.25" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}

/** An open padlock: unlocked. */
export function UnlockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.25" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 4.9-.7" />
    </svg>
  );
}

/** An open eye: visible. */
export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

/** A struck-through eye: hidden. */
export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.2 3.8A6.6 6.6 0 0 1 8 3.5C12 3.5 14.5 8 14.5 8a11 11 0 0 1-1.7 2.2M10.4 11.9A6 6 0 0 1 8 12.5C4 12.5 1.5 8 1.5 8a11 11 0 0 1 2.6-3M6.6 6.6a2 2 0 0 0 2.8 2.8M2.5 2.5l11 11" />
    </svg>
  );
}

/** Two opposing arrows: flip. */
export function FlipIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 5.5h10l-2.5-2.5M13.5 10.5h-10l2.5 2.5" />
    </svg>
  );
}

/** A quarter-turn arrow: rotate 90°. */
export function RotateQuarterIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 8a4.5 4.5 0 1 0 1.3-3.2M4.8 2.3v2.5h2.5" />
    </svg>
  );
}

/** A filled square: one solid color. */
export function SolidFillIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" />
    </svg>
  );
}

/** A square fading across: a linear gradient. */
export function GradientFillIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="10" height="10" rx="1.5" />
      <path d="M3.5 5.5h2M3.5 8h4M3.5 10.5h6" />
    </svg>
  );
}

/** An arrow cursor: select. */
export function PointerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 2.5 12.5 9l-3.9.6 2.2 4.1-1.6.8-2.2-4.1L4 13z" />
    </svg>
  );
}
