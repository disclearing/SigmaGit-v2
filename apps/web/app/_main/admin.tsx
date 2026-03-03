import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/layout";
import { createMeta } from "@/lib/seo";

export const Route = createFileRoute("/_main/admin")({
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
