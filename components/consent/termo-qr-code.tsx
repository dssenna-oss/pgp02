"use client";

/**
 * QR Code da URL pública de um Termo de Consentimento.
 *
 * Útil pra atendimento presencial / balcão: o cidadão escaneia o
 * código com a câmera do celular, abre a URL pública e dá o aceite
 * digital com toda a evidência (IP/UA/checksum). Eliminar papel sem
 * eliminar a presencialidade.
 *
 * Implementação:
 *   - Lib: `qrcode` (npm) — pequena, sem dependências, sem net.
 *   - Render: canvas client-side de 256×256 com margem branca.
 *   - Download: canvas → blob PNG → anchor descartável.
 */

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Copy, Loader2 } from "lucide-react";

interface Props {
  url: string;
  termTitle: string;
  termSlug: string;
}

export default function TermoQrCode({ url, termTitle, termSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);
    setError(null);
    QRCode.toCanvas(canvas, url, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#1f2937",
        light: "#ffffff",
      },
    })
      .then(() => {
        if (!cancelled) setRendering(false);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setRendering(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Falha ao gerar PNG");
        return;
      }
      const link = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = `qr-termo-${termSlug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Libera memória do blob na próxima tick.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
      toast.success("PNG baixado.");
    }, "image/png");
  }

  function copyUrl() {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada.");
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-w-md">
      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
        📱 QR Code da URL pública
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Imprima ou exiba no balcão. O cidadão escaneia com o celular e
        abre o termo pra aceitar digitalmente.
      </p>
      <div className="flex flex-col items-center gap-3">
        <div className="bg-white p-2 rounded border border-gray-200 dark:border-gray-700">
          <canvas
            ref={canvasRef}
            className={rendering || error ? "opacity-30" : ""}
            width={256}
            height={256}
          />
          {rendering && (
            <div className="text-xs text-gray-500 text-center mt-2">
              <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
              Gerando QR...
            </div>
          )}
          {error && (
            <p className="text-xs text-red-600 text-center mt-2">{error}</p>
          )}
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-300 text-center">
          <div className="font-medium truncate max-w-xs">{termTitle}</div>
          <div className="font-mono text-[10px] text-gray-500 break-all max-w-xs">
            {url}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyUrl}
            className="text-xs"
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copiar URL
          </Button>
          <Button
            size="sm"
            onClick={downloadPng}
            disabled={rendering || !!error}
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Baixar PNG
          </Button>
        </div>
      </div>
    </div>
  );
}
