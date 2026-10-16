import type { ReactNode } from "react";
import DashboardSession from "../components/dashboard/DashboardSession";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardSession>{children}</DashboardSession>;
}