import { View, Text } from "react-native";

interface LabelBadgeProps {
  name: string;
  color?: string | null;
  className?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const match = hex.replace("#", "").match(/.{2}/g);
  if (!match) return `rgba(100,100,100,${alpha})`;
  const [r, g, b] = match.map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

export function LabelBadge({ name, color, className = "" }: LabelBadgeProps) {
  const bg = color ? hexToRgba(color, 0.25) : "rgba(100,100,100,0.25)";
  const border = color || "#6b7280";
  const textColor = color || "#9ca3af";

  return (
    <View
      style={{ backgroundColor: bg, borderColor: border }}
      className={`rounded border px-2 py-0.5 ${className}`}
    >
      <Text style={{ color: textColor }} className="text-xs font-medium">
        {name}
      </Text>
    </View>
  );
}
