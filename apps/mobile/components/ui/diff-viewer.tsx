import { ScrollView, Text, View } from "react-native";
import { MonoText } from "../StyledText";

interface DiffViewerProps {
  content: string;
  className?: string;
}

type LineType = "add" | "remove" | "context";

function parseDiffLines(content: string): { line: string; type: LineType }[] {
  return content.split("\n").map((line) => {
    if (line.startsWith("+") && !line.startsWith("+++")) return { line: line.slice(1), type: "add" as LineType };
    if (line.startsWith("-") && !line.startsWith("---")) return { line: line.slice(1), type: "remove" as LineType };
    return { line, type: "context" as LineType };
  });
}

export function DiffViewer({ content, className = "" }: DiffViewerProps) {
  const lines = parseDiffLines(content);

  return (
    <ScrollView horizontal className={className}>
      <View className="flex-row min-w-full">
        <View className="w-8 border-r border-gray-700 bg-gray-900/50 pr-1">
          {lines.map(({ type }, i) => (
            <View key={i} className="h-5 items-end justify-center">
              <Text className="text-xs text-gray-500 font-mono">{i + 1}</Text>
            </View>
          ))}
        </View>
        <View className="flex-1">
          {lines.map(({ line, type }, i) => (
            <View
              key={i}
              className={`h-5 flex-row items-center px-2 ${
                type === "add" ? "bg-green-500/10" : type === "remove" ? "bg-red-500/10" : ""
              }`}
            >
              <Text className="w-4 text-xs text-gray-500 font-mono">{type === "add" ? "+" : type === "remove" ? "-" : " "}</Text>
              <MonoText className="flex-1 text-xs text-white" numberOfLines={1}>
                {line || " "}
              </MonoText>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
