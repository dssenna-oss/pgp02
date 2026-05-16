import { redirect } from "next/navigation";

// Home — sempre redireciona pro login.
// O middleware lida com a redireção de volta pro dashboard se já autenticado.
export default function HomePage() {
  redirect("/login");
}
