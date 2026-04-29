

"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Upload, Trash2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

export default function CompanyLogoUploader() {
  const { data: session } = useSession() || {};
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = session?.user?.role === "admin";

  // Busca o logo atual
  const fetchLogo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/company/logo");
      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.logoUrl || null);
      }
    } catch (error) {
      console.error("Erro ao buscar logo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega o logo ao montar o componente
  useEffect(() => {
    fetchLogo();
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Valida o tipo de arquivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Tipo de arquivo inválido. Use JPG, PNG, GIF ou WebP");
      return;
    }

    // Valida o tamanho (max 2MB — alinhado com a API)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 2MB");
      return;
    }

    await uploadLogo(file);
  };

  const uploadLogo = async (file: File) => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/company/logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fazer upload");
      }

      const data = await response.json();
      setLogoUrl(data.logoUrl);
      toast.success("Logo atualizado com sucesso!");

      // Recarrega a página para atualizar o logo na sidebar
      window.location.reload();
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error(error.message || "Erro ao fazer upload do logo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm("Tem certeza que deseja remover o logo da empresa?")) {
      return;
    }

    try {
      setIsUploading(true);

      const response = await fetch("/api/company/logo", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao remover logo");
      }

      setLogoUrl(null);
      toast.success("Logo removido com sucesso!");

      // Recarrega a página para atualizar o logo na sidebar
      window.location.reload();
    } catch (error: any) {
      console.error("Erro ao remover logo:", error);
      toast.error(error.message || "Erro ao remover logo");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAdmin) {
    return null; // Não exibe nada se não for admin
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logo da Empresa
        </CardTitle>
        <CardDescription>
          Faça upload do logo da sua empresa. Será exibido na sidebar e em relatórios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview do logo */}
        <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Carregando...</span>
            </div>
          ) : logoUrl ? (
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo da empresa"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <ImageIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
              <p>Nenhum logo carregado</p>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fazendo upload...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {logoUrl ? "Alterar Logo" : "Fazer Upload"}
              </>
            )}
          </Button>

          {logoUrl && (
            <Button
              variant="destructive"
              onClick={handleRemoveLogo}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          )}
        </div>

        {/* Informações sobre o arquivo */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Formatos aceitos: JPG, PNG, GIF, WebP</p>
          <p>• Tamanho máximo: 2MB</p>
          <p>• Recomendado: imagem quadrada com fundo transparente</p>
        </div>
      </CardContent>
    </Card>
  );
}
