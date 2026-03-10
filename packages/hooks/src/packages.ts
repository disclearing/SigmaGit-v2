import { useQuery } from "@tanstack/react-query";
import { useApi } from "./context";

export function useUserPackages(username: string, options?: { enabled?: boolean }) {
  const api = useApi();
  return useQuery({
    queryKey: ["packages", username],
    queryFn: () => api.packages.listForUser(username),
    enabled: (options?.enabled ?? true) && !!username,
  });
}

export function usePackageTags(username: string, image: string, options?: { enabled?: boolean }) {
  const api = useApi();
  return useQuery({
    queryKey: ["packages", username, image, "tags"],
    queryFn: () => api.packages.getTags(username, image),
    enabled: (options?.enabled ?? true) && !!username && !!image,
  });
}
