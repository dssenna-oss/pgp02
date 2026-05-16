import { AuthedLayout } from "@/components/authed-layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthedLayout>{children}</AuthedLayout>;
}
