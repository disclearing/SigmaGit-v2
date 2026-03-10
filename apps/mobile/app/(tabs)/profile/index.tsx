import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Link, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { BlurView } from "expo-blur";
import { useSession, signOut } from "@/lib/auth-client";
import { useUserRepositories, useUserProfile } from "@sigmagit/hooks";
import { useQueryClient } from "@tanstack/react-query";
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

// Modern menu item component
function MenuItem({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      <View className="overflow-hidden rounded-xl border border-white/10 bg-[rgba(40,40,60,0.4)]">
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View className="flex-row items-center justify-between p-4 relative z-10">
          <View className="flex-row items-center">
            <View
              className={`mr-3 size-9 items-center justify-center rounded-lg ${
                destructive ? "bg-red-500/15" : "bg-white/10"
              }`}
            >
              <FontAwesome
                name={icon}
                size={16}
                color={destructive ? "#f87171" : "rgba(255,255,255,0.8)"}
              />
            </View>
            <Text
              className={`text-[16px] font-medium ${
                destructive ? "text-red-400" : "text-white"
              }`}
            >
              {label}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color="rgba(255,255,255,0.3)" />
        </View>
      </View>
    </Pressable>
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
  username?: string;
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

export default function ProfileScreen() {
  const { data: session, isPending } = useSession();
  const queryClient = useQueryClient();

  const user = session?.user as
    | { name?: string; email?: string; username?: string; image?: string; role?: string }
    | undefined;
  const isAdmin = user?.role === "admin";
  const {
    data: reposData,
    isLoading,
    refetch,
    isRefetching,
  } = useUserRepositories(user?.username || "");
  const { data: profileData } = useUserProfile(user?.username || "");
  const avatarUrl = profileData?.avatarUrl;

  const repos = reposData?.repos || [];
  const handleRefresh = () => refetch();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          queryClient.clear();
        },
      },
    ]);
  };

  if (isPending) {
    return (
      <View style={{ flex: 1 }} className="items-center justify-center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (!session?.user) {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }} className="items-center justify-center px-6">
          <View className="w-full max-w-[320px] overflow-hidden rounded-3xl border border-white/10 bg-[rgba(40,40,60,0.6)]">
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
            <View className="items-center p-8 relative z-10">
              <View className="mb-5 size-20 items-center justify-center rounded-2xl bg-white/10">
                <FontAwesome name="user" size={40} color="rgba(255,255,255,0.5)" />
              </View>
              <Text className="mb-2 text-[24px] font-bold text-white">Not signed in</Text>
              <Text className="mb-6 text-center text-[15px] text-white/50">
                Sign in to view your profile and repositories
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable className="overflow-hidden rounded-xl bg-blue-600/30">
                  <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                  <View className="px-8 py-3.5 relative z-10">
                    <Text className="text-[16px] font-semibold text-white">Sign In</Text>
                  </View>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const totalStars = repos.reduce((sum, repo) => sum + (repo.starCount || 0), 0);

  return (
    <View style={{ flex: 1 }}>
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
            <View className="flex-row items-center">
              <View className="mr-4">
                <UserAvatar avatarUrl={avatarUrl} size={72} />
              </View>
              <View className="flex-1">
                <Text className="text-[22px] font-bold text-white">{user?.name}</Text>
                <Text className="mt-0.5 text-[15px] text-white/60">@{user?.username}</Text>
                {user?.email && (
                  <Text className="mt-1 text-[13px] text-white/40">{user.email}</Text>
                )}
              </View>
            </View>

            {/* Stats Row */}
            <View className="mt-5 flex-row gap-3">
              <StatCard value={repos.length} label="Repos" icon="code-fork" />
              <StatCard value={totalStars} label="Stars" icon="star" />
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View className="mb-4 space-y-2">
          <MenuItem
            icon="cog"
            label="Settings"
            onPress={() => router.push("/settings")}
          />
          {isAdmin && (
            <MenuItem
              icon="shield"
              label="Admin Panel"
              onPress={() => router.push("/admin")}
            />
          )}
        </View>

        {/* Repositories Section */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-[17px] font-semibold text-white">Your Repositories</Text>
          {repos.length > 0 && (
            <View className="rounded-full bg-white/10 px-2.5 py-1">
              <Text className="text-[12px] font-medium text-white/60">{repos.length}</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View className="py-8">
            <ActivityIndicator size="small" color="#60a5fa" />
          </View>
        ) : repos.length === 0 ? (
          <EmptyState icon="inbox" title="You haven't created any repositories yet" />
        ) : (
          <View className="mb-4">
            {repos.map((repo, index) => (
              <RepositoryCard
                key={repo.id}
                repo={repo}
                username={user?.username}
                isLast={index === repos.length - 1}
              />
            ))}
          </View>
        )}

        {/* Sign Out Button */}
        <MenuItem
          icon="sign-out"
          label="Sign Out"
          onPress={handleSignOut}
          destructive
        />
      </ScrollView>
    </View>
  );
}
