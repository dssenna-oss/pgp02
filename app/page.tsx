
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing-page";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Se o usuário estiver logado, redireciona para o dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Se não estiver logado, mostra a landing page
  return <LandingPage />;
}
