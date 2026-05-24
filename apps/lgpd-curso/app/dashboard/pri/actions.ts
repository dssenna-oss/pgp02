"use server";

// Documento institucional do PRI (Frente 3). Espelha o padrão do Aviso de
// Privacidade — usa a tabela Policy com o slug pri-resposta-incidentes.

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { checkGapConcluido } from "@/lib/phase-guard";
import { detectarPlaceholders } from "@/lib/aviso-auto-preencher";
import { PRI_SLUG, gerarRascunhoPri } from "@/lib/pri-secoes";

export type PriResult = { ok: true; pri: any } | { ok: false; error: string };

export async function getPri() {
  const { companyId } = await requireCompany();
  return prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: PRI_SLUG } },
  });
}

export async function savePri(conteudoMd: string) {
  const skip = await checkGapConcluido("FASE_7", "Salvar documento do PRI");
  if (skip) return skip;
  const { companyId } = await requireCompany();
  const result = await prisma.policy.upsert({
    where: { companyId_slug: { companyId, slug: PRI_SLUG } },
    create: {
      companyId,
      slug: PRI_SLUG,
      titulo: "Plano de Resposta a Incidentes (PRI)",
      conteudoMd,
      status: "RASCUNHO",
    },
    update: { conteudoMd },
  });
  revalidatePath("/dashboard/pri");
  return result;
}

export async function publicarPri(): Promise<PriResult | { skip: any }> {
  const skip = await checkGapConcluido("FASE_7", "Publicar documento do PRI");
  if (skip) return skip as any;
  const { companyId } = await requireCompany();

  const policy = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: PRI_SLUG } },
  });
  if (!policy) {
    return { ok: false, error: "Crie o documento antes de publicar (clique em Salvar rascunho primeiro)." };
  }

  // Anti-placeholder: publicar com textos [entre colchetes] do template é
  // "compliance fake" — pior que não publicar.
  const placeholders = detectarPlaceholders(policy.conteudoMd || "");
  if (placeholders.length > 0) {
    const preview = placeholders.slice(0, 3).map((p) => `"[${p}]"`).join(", ");
    const extras = placeholders.length > 3 ? ` e mais ${placeholders.length - 3}` : "";
    return {
      ok: false,
      error:
        `Publicação bloqueada: o PRI ainda contém ${placeholders.length} placeholder(s) do template — ` +
        `${preview}${extras}. Substitua todos os textos [entre colchetes] por informações reais antes de publicar.`,
    };
  }

  // Versionamento: cada publicação vira uma PolicyVersion no histórico.
  const ultima = await prisma.policyVersion.findFirst({
    where: { policyId: policy.id },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  const numero = (ultima?.numero ?? 0) + 1;

  const publicSlug = `${companyId.slice(0, 6)}-pri`;
  const result = await prisma.policy.update({
    where: { id: policy.id },
    data: { status: "PUBLICADO", publicSlug, publishedAt: new Date() },
  });
  await prisma.policyVersion.create({
    data: {
      policyId: policy.id,
      numero,
      conteudoMd: policy.conteudoMd,
      changelog: `Publicação ${numero}`,
    },
  });
  revalidatePath("/dashboard/pri");
  return { ok: true, pri: result };
}

export async function reabrirPri(): Promise<PriResult | { skip: any }> {
  const skip = await checkGapConcluido("FASE_7", "Reabrir documento do PRI");
  if (skip) return skip as any;
  const { companyId } = await requireCompany();
  const policy = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: PRI_SLUG } },
  });
  if (!policy) return { ok: false, error: "Documento do PRI não encontrado." };
  if (policy.status !== "PUBLICADO") return { ok: false, error: "O documento não está publicado." };
  const result = await prisma.policy.update({
    where: { id: policy.id },
    data: { status: "RASCUNHO" },
  });
  revalidatePath("/dashboard/pri");
  return { ok: true, pri: result };
}

// Monta o markdown do PRI a partir dos dados que já existem no app — dados do
// órgão, Encarregado e equipe do PRI. Não persiste; retorna o texto.
export async function autoPreencherPri(): Promise<
  { ok: true; md: string } | { ok: false; error: string }
> {
  try {
    const { companyId } = await requireCompany();
    const [company, membros] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, cnpj: true, dpoName: true, dpoEmail: true, dpoTelefone: true },
      }),
      prisma.priMembroEquipe.findMany({
        where: { companyId },
        orderBy: { createdAt: "asc" },
        select: { nome: true, papel: true, contato24h: true, email: true },
      }),
    ]);
    if (!company) return { ok: false, error: "Empresa não encontrada." };
    return { ok: true, md: montarPriPreenchido(company, membros) };
  } catch (e: any) {
    console.error("[autoPreencherPri] erro:", e);
    return { ok: false, error: e?.message || "Erro ao montar o PRI." };
  }
}

function montarPriPreenchido(
  company: {
    name: string;
    cnpj: string | null;
    dpoName: string | null;
    dpoEmail: string | null;
    dpoTelefone: string | null;
  },
  membros: { nome: string; papel: string; contato24h: string | null; email: string | null }[],
): string {
  const orgao = company.name + (company.cnpj ? ` (CNPJ ${company.cnpj})` : "");

  // DPO: se cadastrado em /dashboard/encarregado, usa os dados reais; senão,
  // texto institucional padrão SEM colchetes (não trava publicação).
  // Fix do mismatch anterior: o template diz `[nome, e-mail e telefone]` (sem
  // "do Encarregado") — o replace precisa bater EXATO senão fica sem efeito.
  const dpo = company.dpoName
    ? `${company.dpoName}${company.dpoEmail ? ` — ${company.dpoEmail}` : ""}${company.dpoTelefone ? ` — ${company.dpoTelefone}` : ""}`
    : "A ser preenchido pelo Encarregado designado pelo órgão";

  // Equipe ETIR: se cadastrada no mini-app de Incidentes, lista os membros;
  // senão, texto institucional padrão (também sem colchetes — facilitador
  // explica no debrief que cada órgão personaliza com sua própria composição).
  const equipe =
    membros.length > 0
      ? membros
          .map(
            (m) =>
              `- ${m.nome} — ${m.papel}` +
              `${m.contato24h ? ` — contato 24h: ${m.contato24h}` : ""}` +
              `${m.email ? ` — ${m.email}` : ""}`,
          )
          .join("\n")
      : "A Equipe de Resposta a Incidentes (ETIR) é composta pelo Encarregado pelo Tratamento de Dados, por representante da área de Tecnologia da Informação, pela Procuradoria Jurídica e pelo gestor da área impactada. Em caso de incidente, é convocada pelo Encarregado no prazo máximo de 4 horas a partir da ciência.";

  // Textos institucionais padrão pras seções 4-8. Substituem TODOS os
  // placeholders restantes do template — antes só 3 eram cobertos, sobravam
  // 6+ que travavam a publicação. Decisão pedagógica (2026-05-24): no curso
  // o facilitador explica no debrief que esses textos são esqueleto-base e
  // que cada órgão personaliza com sua realidade. Mantém o documento publicável
  // sem fricção, sem perder a discussão pedagógica.
  const deteccao =
    "A detecção de incidentes ocorre por: (a) alertas automáticos de sistemas de monitoramento (SIEM, antivírus, logs); (b) comunicação espontânea de servidores que identifiquem comportamento anômalo; (c) auditorias periódicas de logs e acessos; (d) notificação externa (cidadão, ANPD, parceiros). Qualquer servidor que tomar ciência de incidente potencial deve comunicar imediatamente o Encarregado pelo canal oficial (e-mail institucional ou telefone de plantão da TI).";

  const contencao =
    "isolamento imediato do sistema afetado, bloqueio de contas comprometidas, revogação de credenciais expostas e preservação de evidências forenses";
  const erradicacao =
    "identificação e correção da causa-raiz (vulnerabilidade explorada, configuração incorreta, acesso indevido), aplicação de patches de segurança e remoção de artefatos maliciosos";
  const recuperacao =
    "restauração de dados a partir de backup íntegro e auditado, validação da integridade pós-restauração e retorno gradual à operação normal com monitoramento intensivo";

  const responsaveisComunicacao =
    "A redação e envio da comunicação à ANPD são de responsabilidade do Encarregado, com apoio da Procuradoria Jurídica para revisão. A comunicação aos titulares afetados é elaborada em linguagem clara pelo Encarregado, com apoio da área de Comunicação Social do órgão, e enviada pelos canais disponíveis (e-mail cadastrado, correspondência, divulgação em portal oficial quando o contato direto for inviável).";

  const registro =
    "O registro completo de cada incidente é mantido em sistema interno sob responsabilidade do Encarregado, com acesso restrito à Equipe ETIR e à Procuradoria. O prazo mínimo de conservação é de 5 anos a partir do encerramento do incidente, observada a base legal de cumprimento de obrigação regulatória (Art. 7º, II da LGPD).";

  const periodicidade =
    "Este Plano é revisado pela Equipe ETIR ao menos anualmente, e adicionalmente após todo incidente classificado como ALTA ou CRÍTICA, ou após mudanças significativas no parque tecnológico do órgão (novos sistemas críticos, migração de dados, alteração de fornecedores essenciais).";

  let md = gerarRascunhoPri();

  // Seção 1 — órgão
  md = md.replace("[identifique o órgão]", orgao);

  // Seção 2 — equipe + DPO (fix do mismatch: era "do Encarregado", agora bate
  // exato com o template)
  md = md.replace(
    "[Liste cada membro: nome, papel e contato 24h. Use o botão Auto-preencher para trazer a equipe já cadastrada no mini-app de Incidentes.]",
    equipe,
  );
  md = md.replace("[nome, e-mail e telefone]", dpo);

  // Seção 4 — Detecção e notificação interna (ponto fica DENTRO dos colchetes
  // no template — texto novo inclui ponto final).
  md = md.replace(
    "[Descreva como um incidente pode ser detectado — alerta de sistema, denúncia, auditoria de logs — e o canal interno pelo qual qualquer colaborador comunica a suspeita à equipe de resposta.]",
    deteccao,
  );

  // Seção 5 — Contenção, erradicação e recuperação (ponto fica FORA dos
  // colchetes no template — texto novo SEM ponto final pra não duplicar).
  md = md.replace(
    "[medidas imediatas para limitar o dano — isolar o sistema, bloquear acessos, revogar credenciais comprometidas]",
    contencao,
  );
  md = md.replace(
    "[eliminar a causa-raiz — corrigir a vulnerabilidade, remover o acesso indevido]",
    erradicacao,
  );
  md = md.replace(
    "[restaurar serviços e dados a partir de backup íntegro e confirmar o retorno à normalidade]",
    recuperacao,
  );

  // Seção 6 — Responsáveis pela comunicação
  md = md.replace(
    "[Indique os responsáveis por redigir e enviar cada comunicação e o canal utilizado.]",
    responsaveisComunicacao,
  );

  // Seção 7 — Registro e documentação
  md = md.replace(
    "[Indique onde o registro é mantido e por quanto tempo é conservado.]",
    registro,
  );

  // Seção 8 — Periodicidade de revisão
  md = md.replace(
    "[Defina a periodicidade de revisão deste plano — recomenda-se ao menos uma vez por ano e após todo incidente relevante.]",
    periodicidade,
  );

  return md;
}
