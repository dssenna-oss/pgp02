"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Toaster } from "react-hot-toast";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </SessionProvider>
  );
}
