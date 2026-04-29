
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success("E-mail enviado com sucesso!");
        
        // Em desenvolvimento, mostrar o link
        if (data.resetUrl) {
          setResetUrl(data.resetUrl);
        }
      } else {
        toast.error(data.error || "Erro ao enviar e-mail");
      }
    } catch (error) {
      toast.error("Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-600 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              E-mail Enviado!
            </h1>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <Mail className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="text-gray-700 dark:text-gray-300">
                    Se o e-mail <strong>{email}</strong> estiver cadastrado, 
                    você receberá um link para redefinir sua senha.
                  </p>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Verifique sua caixa de entrada e também a pasta de spam.
                </p>

                {resetUrl && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                      MODO DE DESENVOLVIMENTO
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                      Use este link para redefinir sua senha:
                    </p>
                    <a 
                      href={resetUrl}
                      className="text-xs text-blue-600 hover:text-blue-700 break-all block"
                    >
                      {resetUrl}
                    </a>
                  </div>
                )}

                <div className="pt-4">
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar para Login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Esqueceu a Senha?
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Insira seu e-mail para receber o link de redefinição
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">Recuperar Acesso</CardTitle>
            <CardDescription className="text-center">
              Enviaremos um link seguro para seu e-mail
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
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" />
                Enviar Link de Redefinição
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar para Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
