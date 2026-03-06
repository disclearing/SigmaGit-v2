import { View, Text } from "react-native";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
  className?: string;
  textClassName?: string;
}

const variantStyles = {
  default: "bg-gray-600 border-gray-500",
  success: "bg-green-500/20 border-green-500/50",
  warning: "bg-amber-500/20 border-amber-500/50",
  destructive: "bg-red-500/20 border-red-500/50",
  outline: "bg-transparent border-gray-500",
};

const textVariantStyles = {
  default: "text-gray-200",
  success: "text-green-400",
  warning: "text-amber-400",
  destructive: "text-red-400",
  outline: "text-gray-300",
};

export function Badge({ children, variant = "default", className = "", textClassName = "" }: BadgeProps) {
  return (
    <View className={`rounded-full border px-2.5 py-0.5 ${variantStyles[variant]} ${className}`}>
      <Text className={`text-xs font-medium ${textVariantStyles[variant]} ${textClassName}`}>{children}</Text>
    </View>
  );
}
