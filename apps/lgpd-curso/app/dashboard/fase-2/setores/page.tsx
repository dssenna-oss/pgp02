import { getSetores } from "./actions";
import { SetoresView } from "./setores-view";

export const dynamic = "force-dynamic";

export default async function SetoresPage() {
  const { setores, salvos } = await getSetores();
  return <SetoresView setores={setores} salvos={salvos} />;
}
