import { getCarta } from "./actions";
import { CartaEditor } from "./carta-editor";

export const dynamic = "force-dynamic";

export default async function CartaPage() {
  const { salva, templateSugerido } = await getCarta();
  return <CartaEditor salva={salva} templateSugerido={templateSugerido} />;
}
