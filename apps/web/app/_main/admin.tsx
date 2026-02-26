import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/layout";

export const Route = createFileRoute("/_main/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel | Sigmagit" },
      {
        name: "description",
        content: "Administrative dashboard for managing users, repositories, organizations, and system settings.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Panel | Sigmagit" },
      {
        property: "og:description",
        content: "Administrative dashboard for managing users, repositories, organizations, and system settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Admin Panel | Sigmagit" },
      {
        name: "twitter:description",
        content: "Administrative dashboard for managing users, repositories, organizations, and system settings.",
      },
    ],
  }),
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
