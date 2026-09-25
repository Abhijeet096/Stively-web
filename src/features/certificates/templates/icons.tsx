import "server-only";

import { Svg, Path, Circle, Rect, Ellipse, G, Polygon } from "@react-pdf/renderer";

/** One primitive from a lucide __iconNode array - the same shape lucide-react ships internally, so path data below is copy-pasted straight from node_modules/lucide-react, never hand-traced. */
type IconPrimitive =
  | ["path", { d: string }]
  | ["circle", { cx: string; cy: string; r: string }]
  | ["rect", { width: string; height: string; x: string; y: string; rx?: string; ry?: string }];

/** Renders a lucide icon's primitives through react-pdf's own Svg components - lucide-react's DOM renderer isn't usable here, but the path/circle/rect data is identical. Same 24x24 viewBox, stroke-only styling every lucide icon uses. */
function LucideIcon({ nodes, size, color, strokeWidth = 2 }: { nodes: IconPrimitive[]; size: number; color: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {nodes.map(([tag, props], index) => {
        const common = { stroke: color, strokeWidth, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
        if (tag === "path") return <Path key={index} {...common} d={props.d} />;
        if (tag === "circle") return <Circle key={index} {...common} cx={props.cx} cy={props.cy} r={props.r} />;
        return <Rect key={index} {...common} x={props.x} y={props.y} width={props.width} height={props.height} rx={props.rx} ry={props.ry} />;
      })}
    </Svg>
  );
}

const BRAIN: IconPrimitive[] = [
  ["path", { d: "M12 18V5" }],
  ["path", { d: "M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" }],
  ["path", { d: "M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" }],
  ["path", { d: "M17.997 5.125a4 4 0 0 1 2.526 5.77" }],
  ["path", { d: "M18 18a4 4 0 0 0 2-7.464" }],
  ["path", { d: "M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" }],
  ["path", { d: "M6 18a4 4 0 0 1-2-7.464" }],
  ["path", { d: "M6.003 5.125a4 4 0 0 0-2.526 5.77" }],
];

const PEN_LINE: IconPrimitive[] = [
  ["path", { d: "M13 21h8" }],
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
    },
  ],
];

const SETTINGS_2: IconPrimitive[] = [
  ["path", { d: "M14 17H5" }],
  ["path", { d: "M19 7h-9" }],
  ["circle", { cx: "17", cy: "17", r: "3" }],
  ["circle", { cx: "7", cy: "7", r: "3" }],
];

const LIGHTBULB: IconPrimitive[] = [
  [
    "path",
    { d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" },
  ],
  ["path", { d: "M9 18h6" }],
  ["path", { d: "M10 22h4" }],
];

const TRENDING_UP: IconPrimitive[] = [
  ["path", { d: "M16 7h6v6" }],
  ["path", { d: "m22 7-8.5 8.5-5-5L2 17" }],
];

const CLOCK: IconPrimitive[] = [
  ["circle", { cx: "12", cy: "12", r: "10" }],
  ["path", { d: "M12 6v6l4 2" }],
];

const GRADUATION_CAP: IconPrimitive[] = [
  [
    "path",
    {
      d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
    },
  ],
  ["path", { d: "M22 10v6" }],
  ["path", { d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5" }],
];

const CLIPBOARD_CHECK: IconPrimitive[] = [
  ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
  ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
  ["path", { d: "m9 14 2 2 4-4" }],
];

const BOOK_OPEN: IconPrimitive[] = [
  ["path", { d: "M12 7v14" }],
  [
    "path",
    {
      d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
    },
  ],
];

const ROCKET: IconPrimitive[] = [
  ["path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" }],
  [
    "path",
    { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" },
  ],
  ["path", { d: "M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" }],
  ["path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" }],
];

/**
 * One side of a laurel wreath - a row of small leaf ellipses placed along
 * an arc and rotated to follow it, the standard way a wreath is drawn
 * programmatically rather than as one hand-traced path. `angle 0` is
 * straight up (12 o'clock); angles increase clockwise. `mirror` flips the
 * leaf's own tilt for the right-hand branch, so both sides curve outward
 * symmetrically instead of both leaning the same way.
 */
function WreathBranch({ radius, fromDeg, toDeg, count, color, mirror }: { radius: number; fromDeg: number; toDeg: number; count: number; color: string; mirror?: boolean }) {
  const leaves = Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1);
    const angleDeg = fromDeg + (toDeg - fromDeg) * t;
    const rad = (angleDeg * Math.PI) / 180;
    const x = 50 + radius * Math.sin(rad);
    const y = 50 - radius * Math.cos(rad);
    // Leaves point outward along the tangent, tilted ~35deg off it so they
    // read as individual leaves rather than a smooth solid ring.
    const tilt = angleDeg + (mirror ? -35 : 35);
    return { x, y, tilt, scale: 0.75 + 0.25 * Math.sin(Math.PI * t) };
  });

  return (
    <>
      {leaves.map((leaf, i) => (
        <Ellipse
          key={i}
          cx={leaf.x}
          cy={leaf.y}
          rx={4.2 * leaf.scale}
          ry={2 * leaf.scale}
          fill={color}
          transform={`rotate(${leaf.tilt} ${leaf.x} ${leaf.y})`}
        />
      ))}
    </>
  );
}

/** A gold laurel wreath framing a circular seal, plus a small star at the bottom where the two branches meet - the classic "official seal" motif, built from primitives rather than a traced asset. `size` is the wreath's own bounding box (viewBox is a fixed 0 0 100 100 grid, scaled by the outer Svg's width/height). */
function LaurelWreath({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G>
        <WreathBranch radius={42} fromDeg={200} toDeg={345} count={7} color={color} />
        <WreathBranch radius={42} fromDeg={160} toDeg={15} count={7} color={color} mirror />
        <Polygon points="50,90 51.8,94.5 56.5,94.7 52.8,97.6 54.2,102 50,99.2 45.8,102 47.2,97.6 43.5,94.7 48.2,94.5" fill={color} />
      </G>
    </Svg>
  );
}

/** A few faint curved lines fanning from one corner - the sidebar's quiet background texture, low-opacity gold strokes so it reads as a subtle finish, not a competing pattern. Meant as an absolutely-positioned background layer sized to its container. */
function SidebarFlourish({ width, height, color }: { width: number; height: number; color: string }) {
  const lines = [0, 1, 2, 3, 4, 5];
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {lines.map((i) => {
        const offset = i * 26;
        return (
          <Path
            key={i}
            d={`M ${width + 10} ${-10 + offset} C ${width * 0.55} ${height * 0.15 + offset}, ${width * 0.3} ${height * 0.55 + offset}, ${-10} ${height * 0.75 + offset}`}
            stroke={color}
            strokeWidth={0.75}
            fill="none"
            opacity={0.16}
          />
        );
      })}
    </Svg>
  );
}

export {
  LucideIcon,
  LaurelWreath,
  SidebarFlourish,
  BRAIN,
  PEN_LINE,
  SETTINGS_2,
  LIGHTBULB,
  TRENDING_UP,
  CLOCK,
  GRADUATION_CAP,
  CLIPBOARD_CHECK,
  BOOK_OPEN,
  ROCKET,
};
