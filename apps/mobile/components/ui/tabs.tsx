import { ScrollView, Pressable, Text, View } from "react-native";

export interface TabItem {
  key: string;
  label: string;
  badge?: number | string | null;
}

interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeKey, onSelect, className = "" }: TabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName={`flex-row gap-1 pb-2 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeKey === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            className={`px-4 py-2 rounded-lg flex-row items-center gap-2 ${isActive ? "bg-white/10" : ""}`}
          >
            <Text className={isActive ? "text-white font-semibold" : "text-gray-400 font-medium"}>
              {tab.label}
            </Text>
            {tab.badge != null && tab.badge !== "" ? (
              <View className="bg-gray-600 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
                <Text className="text-xs text-white font-medium">
                  {typeof tab.badge === "number" && tab.badge > 99 ? "99+" : String(tab.badge)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
