import PublicAssessmentForm from "@/components/terceiros/public-assessment-form";

/**
 * Página pública (sem auth) onde o terceiro preenche o formulário de
 * avaliação de risco (Checkpoint 14 / G2).
 *
 * Acesso por `publicToken` gerado pelo DPO. Layout limpo, sem sidebar.
 */
export default function PublicAssessmentPage({
  params,
}: {
  params: { token: string };
}) {
  return <PublicAssessmentForm token={params.token} />;
}
