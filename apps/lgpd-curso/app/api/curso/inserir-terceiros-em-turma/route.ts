// GET/POST /api/curso/inserir-terceiros-em-turma?turmaId=X
// Injeta os 4 operadores Vegas em uma turma EXISTENTE sem precisar resetar.
// Útil pra turmas criadas antes do PR de Gestão de Terceiros (PR #111).
//
// Idempotente: usa (companyId, nome) como chave única. Se o operador já
// existe, pula. Se existe mas sem contract, cria o contract; se já tem
// contract, atualiza só os campos pedagógicos novos (tipoOperacao /
// nivelRisco / observação) preservando o que já foi modificado pelo DPO.
//
// Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { terceirosPorOrgao } from "@/lib/seeds/terceiros-vegas";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function aplicar(turmaId: string) {
  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    include: {
      grupos: { include: { company: { select: { id: true, name: true } } } },
    },
  });
  if (!turma) throw new Error(`Turma ${turmaId} não encontrada`);

  const relatorio: Array<{
    grupo: string;
    operador: string;
    acao: "criado" | "contract_criado" | "contract_atualizado" | "pulado";
  }> = [];

  for (const grupo of turma.grupos) {
    const seedDoOrgao = terceirosPorOrgao(grupo.orgao as "PM" | "CM");
    for (const t of seedDoOrgao) {
      const grupoLabel = `G${grupo.numero}·${grupo.orgao}`;

      // 1. Operator: cria se não existe
      const existente = await prisma.operator.findFirst({
        where: { companyId: grupo.companyId, nome: t.nome },
        include: { contracts: true },
      });

      let operatorId: string;
      let criouOperador = false;
      if (!existente) {
        const novo = await prisma.operator.create({
          data: {
            companyId: grupo.companyId,
            nome: t.nome,
            cnpj: t.cnpj,
            servico: t.servico,
            contato: t.contato,
            papel: "OPERADOR",
          },
        });
        operatorId = novo.id;
        criouOperador = true;
      } else {
        operatorId = existente.id;
      }

      // 2. Contract: cria se não existe; se existe, atualiza só os campos
      //    pedagógicos novos preservando o que o DPO mexeu
      const contractExistente = existente?.contracts?.[0];
      if (!contractExistente) {
        await prisma.operatorContract.create({
          data: {
            operatorId,
            numero: t.contrato.numero,
            objeto: t.contrato.objeto,
            clausulasLgpd: t.contrato.clausulasLgpd,
            vigenciaInicio: t.contrato.vigenciaInicioISO ? new Date(t.contrato.vigenciaInicioISO) : null,
            vigenciaFim:    t.contrato.vigenciaFimISO    ? new Date(t.contrato.vigenciaFimISO)    : null,
            observacao: t.contrato.observacao || null,
            tipoOperacao: t.contrato.tipoOperacao,
            nivelRisco: t.contrato.nivelRisco,
            clausulasSelecionadas: [],
            riscoFatoresMarcados: [],
          },
        });
        relatorio.push({
          grupo: grupoLabel,
          operador: t.nome,
          acao: criouOperador ? "criado" : "contract_criado",
        });
      } else {
        // Preserva o que o DPO já preencheu (clausulas/risco/dd respostas).
        // Só preenche tipoOperacao / nivelRisco / observação se estiverem null.
        const updates: any = {};
        if (!contractExistente.tipoOperacao) updates.tipoOperacao = t.contrato.tipoOperacao;
        if (!contractExistente.nivelRisco)   updates.nivelRisco   = t.contrato.nivelRisco;
        if (!contractExistente.observacao)   updates.observacao   = t.contrato.observacao || null;
        if (Object.keys(updates).length > 0) {
          await prisma.operatorContract.update({
            where: { id: contractExistente.id },
            data: updates,
          });
          relatorio.push({ grupo: grupoLabel, operador: t.nome, acao: "contract_atualizado" });
        } else {
          relatorio.push({ grupo: grupoLabel, operador: t.nome, acao: "pulado" });
        }
      }
    }
  }

  const resumo = {
    criados: relatorio.filter((r) => r.acao === "criado").length,
    contracts_criados: relatorio.filter((r) => r.acao === "contract_criado").length,
    contracts_atualizados: relatorio.filter((r) => r.acao === "contract_atualizado").length,
    pulados: relatorio.filter((r) => r.acao === "pulado").length,
  };

  return { turmaId, turmaNome: turma.nome, totalGrupos: turma.grupos.length, resumo, relatorio };
}

async function handler(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  const turmaId = req.nextUrl.searchParams.get("turmaId");
  if (!turmaId) {
    // Sem turmaId, lista as turmas pra ajudar o user
    const turmas = await prisma.cursoTurma.findMany({
      include: { grupos: { select: { numero: true, orgao: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json({
      hint: "Adicione ?turmaId=XXX na URL pra rodar. Turmas recentes:",
      turmas: turmas.map((t) => ({
        id: t.id,
        nome: t.nome,
        cidade: t.cidade,
        grupos: t.grupos.map((g) => `G${g.numero}·${g.orgao}`).join(", "),
      })),
    });
  }
  try {
    const result = await aplicar(turmaId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("[inserir-terceiros-em-turma] erro:", e);
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
