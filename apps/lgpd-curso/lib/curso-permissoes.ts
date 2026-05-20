// Permissões do curso por papel.
//
// A partir da Fase 4 (GAP Analysis), a EXECUÇÃO do PGP é conduzida pelo
// DPO/Encarregado — espelha a realidade: depois do mapeamento inicial, é o
// Encarregado quem toca o programa, acionando os demais setores quando precisa.
//
// Contribuidores (role MEMBER) entram em "Modo Observador" nas Fases 4-7:
// veem tudo em tempo real, acompanham o trabalho, mas não editam.
// Fases 1-3 (Inventário, Riscos) continuam abertas a todos os papéis —
// é onde cada dono de processo preenche o que conhece.

/** True se o papel pode EDITAR as Fases 4-7 (GAP, Plano, RIPD, Terceiros, DSR, Aviso, Incidentes). */
export function podeEditarFaseAvancada(role: string | null | undefined): boolean {
  return role === "DPO" || role === "ADMIN";
}
