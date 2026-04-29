"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  embedUrl: string | null;
  fileName: string | null;
}

interface ContentViewerModalProps {
  item: ContentItem;
  onClose: () => void;
}

export default function ContentViewerModal({ item, onClose }: ContentViewerModalProps) {
  const renderContent = () => {
    // E-book Heyzine
    if (item.type === "ebook" && item.embedUrl) {
      return (
        <iframe
          src={item.embedUrl}
          className="w-full h-[70vh] border-0 rounded-lg"
          allowFullScreen
        />
      );
    }

    // Vídeo
    if (item.type === "video" && item.embedUrl) {
      // Detecta YouTube
      const youtubeMatch = item.embedUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (youtubeMatch) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
            className="w-full h-[70vh] border-0 rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }

      // Detecta Vimeo
      const vimeoMatch = item.embedUrl.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
            className="w-full h-[70vh] border-0 rounded-lg"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        );
      }

      // URL direta de vídeo
      return (
        <video
          src={item.embedUrl}
          controls
          className="w-full h-[70vh] rounded-lg"
        >
          Seu navegador não suporta o elemento de vídeo.
        </video>
      );
    }

    // URL Externa
    if (item.type === "url" && item.embedUrl) {
      return (
        <iframe
          src={item.embedUrl}
          className="w-full h-[70vh] border-0 rounded-lg"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      );
    }

    // Arquivos (word, pdf, excel) - não podem ser visualizados diretamente
    if (["word", "pdf", "excel"].includes(item.type)) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Este conteúdo é um arquivo {item.fileName ? `(${item.fileName})` : ""} e precisa ser baixado para visualização.
            Use o botão de download na lista de conteúdos.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Este tipo de conteúdo não pode ser visualizado diretamente.
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          {item.description && (
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
