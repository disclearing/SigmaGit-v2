import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/layout";
import { createMeta } from "@/lib/seo";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_main/admin")({
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data?.session) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: createMeta({
      title: "Admin Panel",
      description: "Administrative dashboard for managing users, repositories, organizations, and system settings.",
      noIndex: true,
    }),
  }),
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
