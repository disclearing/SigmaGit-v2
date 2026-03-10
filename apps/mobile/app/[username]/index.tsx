import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { BlurView } from "expo-blur";
import { useUserProfile, useUserRepositories } from "@sigmagit/hooks";
import { useSession } from "@/lib/auth-client";
import { timeAgo, formatDate } from "@sigmagit/lib";
import { UserAvatar } from "@/components/user-avatar";

// Modern stat card component
function StatCard({
  value,
  label,
  icon,
}: {
  value: string | number;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>["name"];
}) {
  return (
    <View className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(40,40,60,0.6)]">
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View className="items-center p-3 relative z-10">
        <View className="mb-2 size-9 items-center justify-center rounded-xl bg-blue-500/20">
          <FontAwesome name={icon} size={16} color="#60a5fa" />
        </View>
        <Text className="text-[20px] font-bold text-white">{value}</Text>
        <Text className="text-[11px] text-white/50">{label}</Text>
      </View>
    </View>
  );
}

// Modern info item component
function InfoItem({
  icon,
  text,
  isLink = false,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  text: string;
  isLink?: boolean;
}) {
  return (
    <View className="mr-4 flex-row items-center">
      <FontAwesome
        name={icon}
        size={12}
        color={isLink ? "#60a5fa" : "rgba(255,255,255,0.5)"}
      />
      <Text
        className={`ml-2 text-[13px] ${
          isLink ? "text-blue-400" : "text-white/60"
        }`}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

// Modern repository card component
function RepositoryCard({
  repo,
  username,
  isLast,
}: {
  repo: {
    id: string;
    name: string;
    description?: string;
    visibility: string;
    starCount: number;
  };
  username: string;
  isLast?: boolean;
}) {
  return (
    <Link href={`/${username}/${repo.name}`} asChild>
      <Pressable className={isLast ? "" : "mb-2"}>
        <View className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(40,40,60,0.4)]">
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View className="flex-row items-center p-4 relative z-10">
            <View className="mr-3 size-11 items-center justify-center rounded-xl bg-blue-500/15">
              <FontAwesome name="code-fork" size={18} color="#60a5fa" />
            </View>
            <View className="flex-1 mr-3">
              <View className="mb-1 flex-row items-center">
                <Text className="mr-2 text-[16px] font-semibold text-white">{repo.name}</Text>
                <View
                  className={`rounded-md px-1.5 py-0.5 ${
                    repo.visibility === "private" ? "bg-yellow-500/15" : "bg-green-500/15"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-semibold ${
                      repo.visibility === "private" ? "text-yellow-400" : "text-green-400"
                    }`}
                  >
                    {repo.visibility}
                  </Text>
                </View>
              </View>
              {repo.description && (
                <Text className="text-[13px] text-white/50" numberOfLines={1}>
                  {repo.description}
                </Text>
              )}
            </View>
            <View className="flex-row items-center rounded-lg bg-yellow-500/15 px-2 py-1">
              <FontAwesome name="star" size={11} color="#fbbf24" />
              <Text className="ml-1 text-xs font-semibold text-yellow-400">{repo.starCount}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

// Modern empty state component
function EmptyState({
  icon,
  title,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
}) {
  return (
    <View className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(40,40,60,0.4)]">
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View className="items-center p-8 relative z-10">
        <View className="mb-3 size-14 items-center justify-center rounded-full bg-white/5">
          <FontAwesome name={icon} size={24} color="rgba(255,255,255,0.3)" />
        </View>
        <Text className="text-center text-[14px] text-white/40">{title}</Text>
      </View>
    </View>
  );
}

// Modern menu button component
function MenuButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(40,40,60,0.4)]">
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View className="flex-row items-center justify-between p-4 relative z-10">
          <View className="flex-row items-center">
            <View className="mr-3 size-10 items-center justify-center rounded-xl bg-purple-500/15">
              <FontAwesome name={icon} size={16} color="#a78bfa" />
            </View>
            <Text className="text-[16px] font-medium text-white">{label}</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color="rgba(255,255,255,0.3)" />
        </View>
      </View>
    </Pressable>
  );
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { data: session } = useSession();
  const currentUsername = (session?.user as { username?: string } | undefined)?.username;

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
    isRefetching: isRefetchingUser,
  } = useUserProfile(username || "");
  const {
    data: reposData,
    isLoading: reposLoading,
    refetch: refetchRepos,
    isRefetching: isRefetchingRepos,
  } = useUserRepositories(username || "");

  const repos = reposData?.repos || [];
  const isLoading = userLoading || reposLoading;
  const isRefetching = isRefetchingUser || isRefetchingRepos;

  const handleRefresh = () => {
    refetchUser();
    refetchRepos();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }} className="items-center justify-center">
        <Stack.Screen
          options={{
            title: "",
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerTransparent: true,
            headerLargeTitle: false,
          }}
        />
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (userError || !user) {
    return (
      <View style={{ flex: 1 }} className="items-center justify-center px-6">
        <Stack.Screen options={{ title: "Error" }} />
        <View className="overflow-hidden rounded-3xl border border-white/10 bg-[rgba(40,40,60,0.6)]">
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View className="items-center p-8 relative z-10">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-red-500/15">
              <FontAwesome name="exclamation-circle" size={32} color="#f87171" />
            </View>
            <Text className="text-center text-[16px] text-red-400">
              {userError?.message || "User not found"}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const totalStars = repos.reduce((sum, repo) => sum + (repo.starCount || 0), 0);
  const isOwnProfile = currentUsername === username;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: user.username,
          headerShown: true,
          headerBackButtonDisplayMode: "minimal",
          headerTransparent: true,
          headerLargeTitle: false,
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerClassName="px-4 py-4"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#60a5fa" />
        }
      >
        {/* Profile Card */}
        <View className="mb-4 overflow-hidden rounded-3xl border border-white/10 bg-[rgba(40,40,60,0.6)]">
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View className="p-5 relative z-10">
            {/* Header with Avatar */}
            <View className="flex-row items-start">
              <View className="mr-4">
                <UserAvatar avatarUrl={user.avatarUrl} size={80} />
              </View>
              <View className="flex-1 pt-1">
                <Text className="text-[24px] font-bold text-white">{user.name}</Text>
                <Text className="mt-0.5 text-[16px] text-white/60">@{user.username}</Text>
                {user.pronouns && (
                  <Text className="mt-1 text-[13px] text-white/40">{user.pronouns}</Text>
                )}
              </View>
            </View>

            {/* Bio */}
            {user.bio && (
              <Text className="mt-4 text-[15px] leading-6 text-white/80">{user.bio}</Text>
            )}

            {/* Info Row */}
            <View className="mt-4 flex-row flex-wrap">
              {user.location && <InfoItem icon="map-marker" text={user.location} />}
              {user.website && (
                <InfoItem
                  icon="link"
                  text={user.website.replace(/^https?:\/\//, "")}
                  isLink
                />
              )}
              {user.createdAt && (
                <InfoItem
                  icon="calendar"
                  text={`Joined ${formatDate(user.createdAt)}`}
                />
              )}
            </View>

            {/* Stats Row */}
            <View className="mt-5 flex-row gap-3">
              <StatCard value={repos.length} label="Repos" icon="code-fork" />
              <StatCard value={totalStars} label="Stars" icon="star" />
            </View>
          </View>
        </View>

        {/* Packages Menu (only for own profile) */}
        {isOwnProfile && (
          <View className="mb-4">
            <MenuButton
              icon="cube"
              label="Packages"
              onPress={() => {}}
            />
          </View>
        )}

        {/* Repositories Section */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-[17px] font-semibold text-white">Repositories</Text>
          {repos.length > 0 && (
            <View className="rounded-full bg-white/10 px-2.5 py-1">
              <Text className="text-[12px] font-medium text-white/60">{repos.length}</Text>
            </View>
          )}
        </View>

        {repos.length === 0 ? (
          <EmptyState icon="inbox" title="No public repositories" />
        ) : (
          <View>
            {repos.map((repo, index) => (
              <RepositoryCard
                key={repo.id}
                repo={repo}
                username={username}
                isLast={index === repos.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
