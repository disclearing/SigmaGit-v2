import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Stack, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useSearch } from "@sigmagit/hooks";
import { SearchBar } from "@/components/ui/search-bar";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data, isLoading } = useSearch(submitted, { limit: 30, enabled: submitted.length >= 2 });

  const handleSearch = () => {
    setSubmitted(query.trim());
  };

  const results = data?.results ?? [];

  const openResult = (r: (typeof results)[0]) => {
    if (r.type === "repository" && r.owner) router.push(`/${(r.owner as { username: string }).username}/${r.title}`);
    else if (r.type === "user" && r.owner) router.push(`/${(r.owner as { username: string }).username}`);
    else if (r.type === "issue" && r.repository && r.number != null) router.push(`/${r.repository.owner}/${r.repository.name}/issues/${r.number}`);
    else if (r.type === "pull_request" && r.repository && r.number != null) router.push(`/${r.repository.owner}/${r.repository.name}/pulls/${r.number}`);
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ title: "Search" }} />
      <View className="px-4 pt-2 pb-4 border-b border-gray-800">
        <SearchBar value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} placeholder="Search repos, issues, people..." />
        <Pressable onPress={handleSearch} className="mt-2 py-2 bg-blue-600 rounded-lg items-center">
          <Text className="text-white font-semibold">Search</Text>
        </Pressable>
      </View>
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4">
        {!submitted ? (
          <Text className="text-gray-400 text-center py-8">Enter a search query above.</Text>
        ) : isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#60a5fa" />
          </View>
        ) : results.length === 0 ? (
          <Text className="text-gray-400 text-center py-8">No results found.</Text>
        ) : (
          results.map((r) => (
            <Pressable key={`${r.type}-${r.id}`} onPress={() => openResult(r)} className="py-3 border-b border-gray-800 active:bg-white/5">
              <View className="flex-row items-center gap-2">
                <Text className="text-gray-500 text-xs uppercase">{r.type.replace("_", " ")}</Text>
              </View>
              <Text className="text-white font-medium">{r.title}</Text>
              {r.description && <Text className="text-gray-400 text-sm mt-0.5" numberOfLines={1}>{r.description}</Text>}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
