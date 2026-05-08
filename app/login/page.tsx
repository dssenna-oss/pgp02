
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
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 80% 60%, rgba(59, 130, 246, 0.20) 0%, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)",
      }}
    >
      {/* Cadeado abstrato decorativo (CP27 — opção 2 do background) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 450"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g
          transform="translate(580 100)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="3"
          fill="none"
        >
          {/* Arco do cadeado */}
          <path
            d="M 60 110 L 60 80 Q 60 30 110 30 Q 160 30 160 80 L 160 110"
            strokeLinecap="round"
          />
          {/* Corpo do cadeado */}
          <rect x="30" y="110" width="160" height="160" rx="16" fill="rgba(99,102,241,0.05)" />
          {/* Buraco da chave */}
          <circle cx="110" cy="180" r="14" fill="rgba(255,255,255,0.05)" />
          <line
            x1="110"
            y1="180"
            x2="110"
            y2="225"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
        {/* Pontos sutis no fundo */}
        <g fill="rgba(255,255,255,0.08)">
          <circle cx="100" cy="80" r="2" />
          <circle cx="200" cy="180" r="2" />
          <circle cx="80" cy="320" r="2" />
          <circle cx="320" cy="380" r="2" />
          <circle cx="180" cy="50" r="1.5" />
        </g>
      </svg>

      <div className="w-full max-w-md relative z-10">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            LGPD - PGP
          </h1>
          <p className="text-blue-100">
            Programa de Governança em Privacidade
          </p>
        </div>

        <Card className="shadow-xl border-0">
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

        {/* Informações adicionais */}
        <div className="mt-8 text-center">
          <p className="text-xs text-blue-200/70">
            Sistema seguro de conformidade com LGPD
          </p>
        </div>
      </div>
    </div>
  );
}
