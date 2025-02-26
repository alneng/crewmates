import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { useSession } from "@/lib/auth-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import DashboardPage from "@/pages/DashboardPage";
import RoadTripPage from "@/pages/RoadTripPage";
import NewRoadTripPage from "@/pages/NewRoadTripPage";
import JoinSessionPage from "@/pages/JoinSessionPage";
import HomePage from "@/pages/HomePage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Public routes */}
          <Route path="/auth" element={<AuthPage />} />
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadtrips/new"
            element={
              <ProtectedRoute>
                <NewRoadTripPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadtrips/:id"
            element={
              <ProtectedRoute>
                <RoadTripPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join/:sessionId"
            element={
              <ProtectedRoute>
                <JoinSessionPage />
              </ProtectedRoute>
            }
          />
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
