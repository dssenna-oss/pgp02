
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { toast } from "react-hot-toast";

interface Document {
  id: string;
  title: string;
  type: string;
  content: string;
  version: string;
  status: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

const documentTypes: { [key: string]: string } = {
  privacy_policy: "Política de Privacidade",
  terms_of_use: "Termos de Uso",
  cookie_notice: "Aviso de Cookies",
  data_processing_agreement: "Contrato de Processamento de Dados",
  consent_form: "Formulário de Consentimento",
  data_subject_rights: "Direitos dos Titulares",
  security_policy: "Política de Segurança",
  retention_policy: "Política de Retenção",
  other: "Outro",
};

export default function DocumentViewModal({
  isOpen,
  onClose,
  document,
}: DocumentViewModalProps) {
  if (!document) return null;

  const downloadDocument = () => {
    const blob = new Blob([document.content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.title.replace(/\s+/g, "_")}_v${document.version}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Documento baixado com sucesso!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {document.title}
          </DialogTitle>
          <DialogDescription>
            {documentTypes[document.type] || document.type} - Versão {document.version}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm flex-1">
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                <p className="font-medium">{document.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Idioma</p>
                <p className="font-medium">{document.language}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Última Atualização</p>
                <p className="font-medium">
                  {new Date(document.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <Button onClick={downloadDocument} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          </div>

          <ScrollArea className="max-h-[calc(90vh-280px)] border rounded-lg">
            <div className="p-6 whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {document.content}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
