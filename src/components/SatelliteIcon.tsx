import { motion } from "framer-motion";

const COLORS = [
  "hsl(190, 90%, 50%)",
  "hsl(270, 60%, 60%)",
  "hsl(40, 95%, 55%)",
  "hsl(340, 80%, 55%)",
  "hsl(150, 70%, 50%)",
];

export default function SatelliteIcon({
  index = 0,
  size = 48,
}: {
  index?: number;
  size?: number;
}) {
  const color = COLORS[index % COLORS.length];
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 4 + index * 0.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Body */}
      <rect x="20" y="22" width="24" height="20" rx="4" fill={color} opacity={0.9} />
      {/* Solar panels */}
      <rect x="4" y="27" width="14" height="10" rx="2" fill={color} opacity={0.5} />
      <rect x="46" y="27" width="14" height="10" rx="2" fill={color} opacity={0.5} />
      {/* Antenna */}
      <line x1="32" y1="22" x2="32" y2="12" stroke={color} strokeWidth="2" />
      <circle cx="32" cy="10" r="3" fill={color} opacity={0.7} />
      {/* Detail */}
      <rect x="26" y="28" width="12" height="8" rx="2" fill="white" opacity={0.3} />
    </motion.svg>
  );
}
