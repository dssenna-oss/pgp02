
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Credenciais inválidas");
      } else {
        toast.success("Login realizado com sucesso!");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden px-4"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 23, 42, 0.45), rgba(30, 58, 138, 0.40)), url('/images/login-bg/bg1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header (logo + título) — absoluto, acima do tablet */}
      <div className="absolute top-[5%] left-[54%] -translate-x-1/2 text-center z-10 w-full max-w-sm">
        <div className="flex items-center justify-center mb-2">
          <div className="bg-blue-600 p-3 rounded-full shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">
          LGPD - PGP
        </h1>
        <p className="text-blue-100 drop-shadow-md text-sm">
          Programa de Governança em Privacidade
        </p>
      </div>

      {/* Card — absoluto, centralizado dentro do "miolo" do tablet */}
      <div className="absolute top-[46%] left-[54%] -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-10">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Entrar na Conta</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Não tem uma conta?{" "}
                <Link 
                  href="/signup" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Cadastre-se aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer absoluto */}
      <div className="absolute bottom-6 left-[54%] -translate-x-1/2 text-center z-10">
        <p className="text-xs text-blue-200/70 drop-shadow">
          Sistema seguro de conformidade com LGPD
        </p>
      </div>
    </div>
  );
}
