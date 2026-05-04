"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Loader2,
  ExternalLink,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface SnapshotSummary {
  id: string;
  label: string;
  notes: string | null;
  createdAt: string;
  createdBy: { name: string | null; email: string } | null;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function GapSnapshotsModal({ onClose, onCreated }: Props) {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/gap/snapshot", { cache: "no-store" });
      if (!r.ok) {
        toast.error("Erro ao carregar histórico");
        return;
      }
      const j = await r.json();
      setSnapshots(j.snapshots ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const r = await fetch("/api/gap/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!r.ok) {
        const err = await r.json();
        toast.error(err.error ?? "Erro ao criar snapshot");
        return;
      }
      toast.success("Snapshot criado!");
      setLabel("");
      setNotes("");
      onCreated();
      refresh();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apagar esse snapshot? Não dá pra recuperar.")) return;
    const r = await fetch(`/api/gap/snapshot/${id}`, { method: "DELETE" });
    if (!r.ok) {
      toast.error("Erro ao apagar");
      return;
    }
    toast.success("Snapshot apagado");
    refresh();
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Histórico de snapshots</SheetTitle>
          <SheetDescription>
            Versões congeladas do GAP. Cada snapshot guarda todas as suas
            respostas num ponto no tempo — útil pra acompanhar evolução.
          </SheetDescription>
        </SheetHeader>

        {/* Form de criação */}
        <div className="space-y-3 mt-6 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Novo snapshot do estado atual
          </h3>
          <div className="space-y-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Diagnóstico inicial 2026-Q2"
              maxLength={120}
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comentário (opcional): contexto da versão, mudanças desde a última..."
              rows={2}
              maxLength={5000}
            />
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="w-full"
              size="sm"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Congelar versão atual
            </Button>
          </div>
        </div>

        {/* Lista */}
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Snapshots anteriores
          </h3>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : snapshots.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Você ainda não criou nenhum snapshot.
            </p>
          ) : (
            snapshots.map((s) => (
              <div
                key={s.id}
                className="border rounded-md p-3 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {s.label}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {new Date(s.createdAt).toLocaleString("pt-BR")} •{" "}
                      {s.createdBy?.name ?? s.createdBy?.email ?? "—"}
                    </p>
                    {s.notes && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2">
                        {s.notes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex gap-1">
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      title="Exportar XLSX deste snapshot"
                    >
                      <a
                        href={`/api/gap/snapshot/${s.id}/export`}
                        download
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      title="Ver detalhe"
                    >
                      <Link href={`/dashboard/gap-analysis/snapshot/${s.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(s.id)}
                      title="Apagar"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
