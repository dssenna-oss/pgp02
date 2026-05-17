"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function listIncidentes() {
  const { companyId } = await requireCompany();
  return prisma.incident.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

// Pré-requisito do registro de incidente — pra dimensionar dados afetados,
// classificar severidade e notificar titulares, precisa do Inventário.
export async function contarInventariosAprovados() {
  const { companyId } = await requireCompany();
  return prisma.dataInventory.count({ where: { companyId, status: "APROVADO" } });
}

export async function getIncidente(id: string) {
  const { companyId } = await requireCompany();
  return prisma.incident.findFirst({ where: { id, companyId } });
}

export async function saveIncidente(input: {
  id?: string;
  titulo: string;
  descricao?: string;
  severidade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  status?: string;
  ocorridoEm?: string;
  detectadoEm?: string;
  comunicadoAnpd?: boolean;
  comunicadoTitular?: boolean;
}) {
  const { companyId } = await requireCompany();
  const data = {
    companyId,
    titulo: input.titulo,
    descricao: input.descricao || null,
    severidade: input.severidade,
    status: input.status || "RASCUNHO",
    ocorridoEm: input.ocorridoEm ? new Date(input.ocorridoEm) : null,
    detectadoEm: input.detectadoEm ? new Date(input.detectadoEm) : null,
    comunicadoAnpd: !!input.comunicadoAnpd,
    comunicadoTitular: !!input.comunicadoTitular,
  };
  let result;
  if (input.id) {
    // Editar incidente existente (incluindo os disparados pelo facilitador) sempre OK.
    result = await prisma.incident.update({ where: { id: input.id }, data: { ...data, companyId: undefined } });
  } else {
    // Criar incidente manualmente requer Inventário aprovado — Art. 48 §1º LGPD
    // exige notificar titulares afetados e ANPD com "natureza dos dados pessoais
    // afetados", "tipos de titulares afetados" — info que vem do Inventário.
    const aprovados = await prisma.dataInventory.count({ where: { companyId, status: "APROVADO" } });
    if (aprovados === 0) {
      throw new Error(
        "Pré-requisito legal: aprove ao menos 1 processo no Inventário antes de registrar incidente manualmente. Art. 48 §1º LGPD exige descrever 'natureza dos dados pessoais afetados' e 'tipos de titulares' — sem Inventário não é possível dimensionar."
      );
    }
    result = await prisma.incident.create({ data });
  }
  revalidatePath("/dashboard/incidentes");
  return result;
}

export async function deletarIncidente(id: string) {
  const { companyId } = await requireCompany();
  await prisma.incident.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/incidentes");
}

// ------------------------------------------------------------
// Geradores de DOCX — Comunicação ANPD + Carta aos Titulares
// ------------------------------------------------------------

export async function gerarComunicacaoAnpd(id: string) {
  const inc = await getIncidente(id);
  if (!inc) throw new Error("Incidente não encontrado");
  return montarTextoComunicacaoAnpd(inc);
}

export async function gerarCartaTitulares(id: string) {
  const inc = await getIncidente(id);
  if (!inc) throw new Error("Incidente não encontrado");
  return montarTextoCartaTitulares(inc);
}

function montarTextoComunicacaoAnpd(inc: any): string {
  return `COMUNICAÇÃO DE INCIDENTE DE SEGURANÇA COM DADOS PESSOAIS
À AUTORIDADE NACIONAL DE PROTEÇÃO DE DADOS (ANPD)

(Em atendimento ao art. 48 da Lei nº 13.709/2018 — LGPD — e à Resolução CD/ANPD nº 15, de 24/04/2024)

1. IDENTIFICAÇÃO DO CONTROLADOR
   Tribunal de Contas do Estado do Espírito Santo — TCEES
   CNPJ: 28.483.014/0001-22
   Encarregado: [preencher]

2. DESCRIÇÃO DO INCIDENTE
   Título: ${inc.titulo}
   Severidade: ${inc.severidade}
   ${inc.descricao || "[Descreva a natureza do incidente, dados afetados e categorias de titulares]"}

3. CRONOLOGIA
   Ocorrido em: ${inc.ocorridoEm ? new Date(inc.ocorridoEm).toLocaleString("pt-BR") : "[informar]"}
   Detectado em: ${inc.detectadoEm ? new Date(inc.detectadoEm).toLocaleString("pt-BR") : "[informar]"}
   Comunicado à ANPD em: ${new Date().toLocaleString("pt-BR")}

4. NATUREZA DOS DADOS AFETADOS
   [Liste categorias de dados pessoais — cadastrais, sensíveis (saúde, biométricos), etc.]

5. INFORMAÇÕES SOBRE OS TITULARES
   [Número estimado de titulares afetados, categorias (cidadãos, servidores, denunciantes)]

6. MEDIDAS TÉCNICAS E DE SEGURANÇA UTILIZADAS PROTEÇÃO DOS DADOS
   [Descrever — criptografia, controle de acesso, segregação, etc.]

7. RISCOS RELACIONADOS AO INCIDENTE
   [Análise de risco: probabilidade de uso indevido, impacto a direitos e liberdades dos titulares]

8. MEDIDAS ADOTADAS OU EM ANDAMENTO PRA REVERTER/MITIGAR O DANO
   [Contenção imediata, comunicação, suporte aos titulares, providências corretivas]

9. MOTIVO DE EVENTUAL ATRASO NA COMUNICAÇÃO
   [Se aplicável]

Vitória/ES, ${new Date().toLocaleDateString("pt-BR")}.

_________________________________________________________
Encarregado pelo Tratamento de Dados Pessoais
TCEES`;
}

function montarTextoCartaTitulares(inc: any): string {
  return `CARTA AOS TITULARES — COMUNICAÇÃO DE INCIDENTE DE SEGURANÇA
(Em atendimento ao art. 48 da Lei nº 13.709/2018 — LGPD)

Prezado(a) titular,

Vimos por meio desta comunicar a você um incidente de segurança envolvendo dados pessoais sob nossa responsabilidade.

O QUE ACONTECEU
${inc.titulo}.

${inc.descricao || "[Descreva o ocorrido em linguagem clara, evitando jargão técnico.]"}

QUANDO ACONTECEU
${inc.ocorridoEm ? `O incidente ocorreu em ${new Date(inc.ocorridoEm).toLocaleString("pt-BR")}.` : "[Data e horário do ocorrido]"}

QUAIS DADOS SEUS PODEM TER SIDO AFETADOS
[Liste os tipos de dados pessoais que foram comprometidos.]

O QUE FIZEMOS
[Descreva as medidas adotadas — contenção, investigação, comunicação às autoridades.]

O QUE VOCÊ PODE FAZER
- Acompanhe atividades suspeitas em sua conta/dados.
- Em caso de dúvida, entre em contato com nosso Encarregado.

SEUS DIREITOS
Você pode, a qualquer tempo, requisitar acesso, correção, anonimização ou exclusão dos seus dados pessoais, na forma do art. 18 da LGPD.

NOSSO CANAL
Encarregado pelo Tratamento de Dados Pessoais — TCEES
E-mail: encarregado@tcees.tc.br
Telefone: (27) 3334-7601

Lamentamos profundamente o ocorrido e reafirmamos nosso compromisso com a proteção dos seus dados.

Atenciosamente,

Encarregado pelo Tratamento de Dados Pessoais
Tribunal de Contas do Estado do Espírito Santo
${new Date().toLocaleDateString("pt-BR")}`;
}
