import { AuthedLayout } from "@/components/authed-layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthedLayout>{children}</AuthedLayout>;
}
