"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_REQUIRED_EVENT, getAccessToken } from "../../../lib/api-client";
import { clearDemoIdentity, getDemoIdentity } from "../../../lib/demo-workspace";

export default function DashboardSession({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const identity = getDemoIdentity();
    const token = getAccessToken();

    if (!identity || !token) {
      clearDemoIdentity();
      setIsAuthenticated(false);
      router.replace("/");
      return;
    }

    if (pathname.startsWith("/dashboard/admin") && identity.role !== "admin") {
      setIsAuthenticated(false);
      router.replace(`/dashboard/${identity.role}`);
      return;
    }

    setIsAuthenticated(true);
  }, [pathname, router]);

  useEffect(() => {
    const requireSignIn = () => {
      setIsAuthenticated(false);
      router.replace("/");
    };

    window.addEventListener(AUTH_REQUIRED_EVENT, requireSignIn);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, requireSignIn);
  }, [router]);

  if (!isAuthenticated) {
    return <main className="grid min-h-svh place-items-center bg-[#f7f0e7] text-sm text-[#6f6054]">Checking your session…</main>;
  }

  return children;
}