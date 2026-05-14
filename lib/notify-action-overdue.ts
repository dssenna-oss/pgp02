/**
 * Disparo IMEDIATO de email pra DPOs quando uma ação do Plano vira
 * "atrasada" por um evento humano (criação ou edição).
 *
 * Complementa o cron diário `/api/cron/action-plan-reminders` (PR #13)
 * — o cron pega o "tempo passou", esse helper pega o "humano errou
 * agora". Indica oversight: ação criada já vencida, ou edição moveu
 * o prazo pro passado.
 *
 * Fire-and-forget: o caller não espera retorno. Falhas no envio não
 * quebram o fluxo principal de criar/editar ação.
 */

import { prisma } from "./db";
import { sendEmail } from "./email-sender";
import { tplActionPlanOverdueAlert } from "./email-templates";

const DPO_ROLES = [
  "admin",
  "DPO_PRINCIPAL",
  "DPO_SUBSTITUTO",
  "DPO_AUXILIAR",
];

interface ActionForAlert {
  id: string;
  title: string;
  priority: string;
  origin: string;
  dueDate: Date;
  companyId: string;
  assignee?: { name: string | null } | null;
}

/**
 * Calcula `daysOverdue` (>= 1 quando atrasada). Retorna 0 se a data
 * é hoje ou no futuro.
 */
function computeDaysOverdue(dueDate: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate(),
  );
  const ms = today.getTime() - due.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / 86_400_000);
}

/**
 * Verdadeiro só quando faz sentido alertar:
 *   - há `dueDate` no passado (>=1 dia)
 *   - status A_FAZER ou EM_ANDAMENTO
 */
export function shouldAlertOverdue(
  action: { dueDate: Date | null; status: string },
): boolean {
  if (!action.dueDate) return false;
  if (action.status !== "A_FAZER" && action.status !== "EM_ANDAMENTO") {
    return false;
  }
  return computeDaysOverdue(action.dueDate) >= 1;
}

/**
 * Busca DPOs opt-in da org da ação e dispara emails em paralelo
 * (fire-and-forget). Não lança — caller chama com `void
 * notifyActionOverdue(...)` ou similar.
 *
 * `trigger` distingue se a ação acabou de ser criada (POST) ou se
 * uma edição (PATCH) moveu o prazo pro passado — muda só o texto
 * do email, mas não a lógica.
 */
export async function notifyActionOverdue(
  action: ActionForAlert,
  trigger: "criada" | "editada",
): Promise<void> {
  try {
    const dpos = await prisma.user.findMany({
      where: {
        companyId: action.companyId,
        emailNotifyActionPlan: true,
        isActive: true,
        role: { in: DPO_ROLES },
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: { select: { companyName: true } },
      },
    });

    if (dpos.length === 0) return;

    const daysOverdue = computeDaysOverdue(action.dueDate);

    await Promise.all(
      dpos.map((dpo) =>
        sendEmail({
          to: { email: dpo.email, name: dpo.name ?? undefined },
          tag: "action-plan-overdue-alert",
          ...tplActionPlanOverdueAlert({
            recipientName: dpo.name,
            recipientEmail: dpo.email,
            companyName: dpo.company?.companyName ?? null,
            trigger,
            action: {
              id: action.id,
              title: action.title,
              priority: action.priority,
              origin: action.origin,
              assigneeName: action.assignee?.name ?? null,
              dueDate: action.dueDate,
              daysOverdue,
            },
          }),
        }),
      ),
    );
  } catch (e) {
    // Log mas não relança — fluxo principal não pode quebrar
    // por causa de email
    console.error("[notify-action-overdue] erro silencioso", e);
  }
}
