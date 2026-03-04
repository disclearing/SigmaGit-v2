"use client";

import { useEffect } from "react";
import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { QueryProvider } from "@/lib/query-client";
import { useWebSocket } from "@/lib/websocket";

export const Route = createFileRoute("/_main")({
  component: MainLayout,
});

function WebSocketConnector() {
  const { connect } = useWebSocket();
  useEffect(() => {
    connect();
  }, [connect]);
  return null;
}

function MainLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <QueryProvider>
      <WebSocketConnector />
      <div className="min-h-screen flex flex-col bg-background">
        {!isAdmin && <Header />}
        <main className="flex-1 py-6 md:py-8">
          <Outlet />
        </main>
        {!isAdmin && <Footer />}
      </div>
    </QueryProvider>
  );
}
