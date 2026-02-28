"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <DashboardSidebar />
            </div>
          </aside>

          {/* Mobile nav */}
          <div className="lg:hidden w-full mb-4">
            <DashboardSidebar />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 hidden lg:block">{children}</div>
        </div>
        {/* Mobile content */}
        <div className="lg:hidden">{children}</div>
      </div>
    </AuthGuard>
  );
}
