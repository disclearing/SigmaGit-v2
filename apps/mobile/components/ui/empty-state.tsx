import { View, Text, type ViewProps } from "react-native";

interface EmptyStateProps extends ViewProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action, className = "", ...props }: EmptyStateProps) {
  return (
    <View className={`items-center justify-center py-12 px-6 ${className}`} {...props}>
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-lg font-semibold text-white text-center mb-2">{title}</Text>
      {description ? (
        <Text className="text-sm text-gray-400 text-center mb-6 max-w-[280px]">{description}</Text>
      ) : null}
      {action ? <View>{action}</View> : null}
    </View>
  );
}
