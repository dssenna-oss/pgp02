/**
 * Helpers de autorização — centraliza checagens de papel pra evitar
 * espalhar `role === "admin"` por toda a UI.
 *
 * Hierarquia (introduzida no checkpoint 2.1):
 *
 *   SUPER_ADMIN  (system-wide, identificado por SUPER_ADMIN_EMAIL no .env)
 *   ├── DPO_PRINCIPAL  (1 por org — encarregado titular)
 *   ├── DPO_SUBSTITUTO (1 por org — substituto do principal)
 *   ├── DPO_AUXILIAR   (N por org — vê tudo, aprova; sem poder de criar/excluir contribuidor)
 *   └── CONTRIBUIDOR   (N — preenche processos do próprio setor)
 *
 *   `admin` (legado) — equivalente a SUPER_ADMIN + DPO_PRINCIPAL.
 *   Mantido pro usuário inicial pré-migração; não usar pra novos cadastros.
 */

export const ROLES = {
  ADMIN_LEGACY: "admin",
  DPO_PRINCIPAL: "DPO_PRINCIPAL",
  DPO_SUBSTITUTO: "DPO_SUBSTITUTO",
  DPO_AUXILIAR: "DPO_AUXILIAR",
  CONTRIBUIDOR: "CONTRIBUIDOR",
  USER_LEGACY: "user",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Conjunto dos papéis "tipo DPO" — qualquer nível de encarregado. */
const DPO_ROLES: ReadonlySet<string> = new Set([
  ROLES.ADMIN_LEGACY,
  ROLES.DPO_PRINCIPAL,
  ROLES.DPO_SUBSTITUTO,
  ROLES.DPO_AUXILIAR,
]);

/** DPOs que podem criar/excluir contribuidores (Principal + Substituto). */
const DPO_MANAGER_ROLES: ReadonlySet<string> = new Set([
  ROLES.ADMIN_LEGACY,
  ROLES.DPO_PRINCIPAL,
  ROLES.DPO_SUBSTITUTO,
]);

/** Qualquer DPO (inclui auxiliar) — pode ver/aprovar processos. */
export function isDPO(role: string | null | undefined): boolean {
  if (!role) return false;
  return DPO_ROLES.has(role);
}

/** DPO com poder de gerenciar contribuidores (Principal ou Substituto). */
export function canManageContributors(role: string | null | undefined): boolean {
  if (!role) return false;
  return DPO_MANAGER_ROLES.has(role);
}

/** Contribuidor — só vê os próprios processos. */
export function isContribuidor(role: string | null | undefined): boolean {
  if (!role) return false;
  return role === ROLES.CONTRIBUIDOR || role === ROLES.USER_LEGACY;
}

/**
 * Super admin do sistema — identificado por email igual a SUPER_ADMIN_EMAIL
 * (env var). Acessa /sysadmin pra criar organizações + DPOs principais.
 *
 * Importante: NÃO depende de role no banco (é configuração de ambiente).
 * Em prod, é um email só. Em dev/test, pode ser outro.
 */
export function isSuperAdmin(
  email: string | null | undefined
): boolean {
  if (!email) return false;
  const target = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!target) return false;
  return email.trim().toLowerCase() === target;
}

/**
 * Versão "robusta" de `isSuperAdmin` que aceita também o role do banco.
 *
 * Aceita SUPER_ADMIN se:
 *   1. Email bate com SUPER_ADMIN_EMAIL (env var), OU
 *   2. Role é `admin` (legado) — equivale a SUPER_ADMIN + DPO_PRINCIPAL.
 *
 * Use esta função em endpoints/páginas que precisam aceitar a conta
 * legada mesmo se SUPER_ADMIN_EMAIL não estiver setado em produção.
 *
 * Recebe email + role separados (não a session inteira) pra ser usável
 * tanto em páginas server-side (com getServerSession) quanto em endpoints
 * de API (com tokens).
 */
export function hasSuperAdminAccess(
  user: { email?: string | null; role?: string | null } | null | undefined
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user.email)) return true;
  if (user.role === ROLES.ADMIN_LEGACY) return true;
  return false;
}

/**
 * Label amigável pra mostrar na UI (sidebar, configurações).
 */
export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case ROLES.ADMIN_LEGACY:
      return "Encarregado (DPO Principal)";
    case ROLES.DPO_PRINCIPAL:
      return "DPO Principal";
    case ROLES.DPO_SUBSTITUTO:
      return "DPO Substituto";
    case ROLES.DPO_AUXILIAR:
      return "DPO Auxiliar";
    case ROLES.CONTRIBUIDOR:
      return "Contribuidor";
    case ROLES.USER_LEGACY:
      return "Usuário";
    default:
      return "Sem papel";
  }
}

// ============================================================
// Status do DataInventory — fluxo de aprovação
// ============================================================

export const INVENTORY_STATUS = {
  RASCUNHO: "RASCUNHO",
  SUBMETIDO: "SUBMETIDO",
  EM_REVISAO: "EM_REVISAO",
  APROVADO: "APROVADO",
  DEVOLVIDO: "DEVOLVIDO",
} as const;

export type InventoryStatus =
  (typeof INVENTORY_STATUS)[keyof typeof INVENTORY_STATUS];

export function inventoryStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case INVENTORY_STATUS.RASCUNHO:
      return "Rascunho";
    case INVENTORY_STATUS.SUBMETIDO:
      return "Submetido";
    case INVENTORY_STATUS.EM_REVISAO:
      return "Em revisão";
    case INVENTORY_STATUS.APROVADO:
      return "Aprovado";
    case INVENTORY_STATUS.DEVOLVIDO:
      return "Devolvido para ajustes";
    default:
      return "Desconhecido";
  }
}

// ============================================================
// Filtros de acesso pra Inventário (checkpoint 2.4)
// ============================================================

/**
 * Retorna o WHERE clause do Prisma pra filtrar inventários conforme o
 * papel do usuário. Princípio:
 *   - DPO (qualquer nível) → vê todos os processos da organização
 *   - Contribuidor → vê só os que ele mesmo criou
 *
 * Combina com o filtro `companyId` que já existe nas queries.
 */
export function inventoryAccessFilter(
  user: { id: string; companyId: string | null; role: string }
): { companyId: string; createdById?: string } | null {
  if (!user.companyId) return null;
  if (isDPO(user.role)) {
    return { companyId: user.companyId };
  }
  // Contribuidor (e roles legados "user") vê só os próprios
  return { companyId: user.companyId, createdById: user.id };
}

/**
 * Verifica se o usuário pode editar/excluir um inventário específico.
 * - DPO → sempre pode (dentro da própria org — checagem de companyId
 *         já feita pela query)
 * - Contribuidor → só se for o criador
 */
export function canModifyInventory(
  user: { id: string; role: string },
  inventory: { createdById: string | null }
): boolean {
  if (isDPO(user.role)) return true;
  return inventory.createdById === user.id;
}

/** Cor (Tailwind) sugerida pra badge do status. */
export function inventoryStatusColor(status: string | null | undefined): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case INVENTORY_STATUS.RASCUNHO:
      return {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-300 dark:border-gray-700",
      };
    case INVENTORY_STATUS.SUBMETIDO:
      return {
        bg: "bg-blue-100 dark:bg-blue-950/40",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-300 dark:border-blue-800",
      };
    case INVENTORY_STATUS.EM_REVISAO:
      return {
        bg: "bg-amber-100 dark:bg-amber-950/40",
        text: "text-amber-800 dark:text-amber-300",
        border: "border-amber-300 dark:border-amber-800",
      };
    case INVENTORY_STATUS.APROVADO:
      return {
        bg: "bg-emerald-100 dark:bg-emerald-950/40",
        text: "text-emerald-800 dark:text-emerald-300",
        border: "border-emerald-300 dark:border-emerald-800",
      };
    case INVENTORY_STATUS.DEVOLVIDO:
      return {
        bg: "bg-red-100 dark:bg-red-950/40",
        text: "text-red-800 dark:text-red-300",
        border: "border-red-300 dark:border-red-800",
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-300",
      };
  }
}
