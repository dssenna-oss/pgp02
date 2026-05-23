// Página /facilitador/lia-modelos — ADMIN-only (herda middleware de
// /facilitador/*). Mostra 2 modelos de LIA preenchidos (PM e CM) com
// abas pra alternar entre eles. Projetável no telão durante a
// Reflexão Final do curso, conectando as Pegadinhas #1 (PM) e #4 (CM)
// ao conceito de LIA exigida pelo Art. 10 §3º LGPD.

import { LiaModelosTabs } from "./lia-modelos-tabs";

export const dynamic = "force-dynamic";

export default function LiaModelosPage() {
  return <LiaModelosTabs />;
}
