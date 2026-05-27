import { getTermometro } from "./actions";
import { TermometroRunner } from "./termometro-runner";

export const dynamic = "force-dynamic";

export default async function TermometroPage() {
  const { inicio, fim } = await getTermometro();
  return <TermometroRunner inicioSalvo={inicio} fimSalvo={fim} />;
}
