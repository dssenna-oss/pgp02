// Gera as 4 telas do app usadas no e-mail de convite
// (app/admin/email-convite). Helper local — roda contra o app em
// localhost:3100 e salva os PNGs em public/email-assets/.
//
// Pré-requisitos: app rodando em :3100, turma "mai-2026" no banco local
// e `npm i playwright-core --no-save`.
//
//   node scripts/_gen-email-screenshots.js

const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3100";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const SENHA = "Curso2026!";
const OUT = path.join(__dirname, "..", "public", "email-assets");

const SHOTS = [
  { url: "/dashboard/inventario", file: "inventario.png", login: "dpo.g1.mai-2026@curso.lgpd" },
  { url: "/dashboard/riscos", file: "riscos.png", login: "dpo.g1.mai-2026@curso.lgpd" },
  { url: "/dashboard/aviso", file: "aviso.png", login: "dpo.g1.mai-2026@curso.lgpd" },
  { url: "/facilitador", file: "painel.png", login: "facilitador@curso.lgpd" },
];

// Login pela API do NextAuth (mais confiável que o formulário, que depende
// da hidratação do React estar pronta). O cookie de sessão fica no contexto.
async function login(page, email) {
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  const status = await page.evaluate(async ({ email, senha }) => {
    const r = await fetch("/api/auth/csrf").then((x) => x.json());
    const body = new URLSearchParams({
      csrfToken: r.csrfToken,
      email,
      password: senha,
      redirect: "false",
      json: "true",
    });
    const res = await fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return res.status;
  }, { email, senha: SENHA });
  console.log("  login", email, "status", status);
  if (status !== 200) throw new Error("login falhou (" + status + ") para " + email);
  await page.waitForTimeout(500);
}

// Remove os banners de topo (treinamento, incidente, DSR) — ruído visual
// que não cabe num e-mail de convite.
async function limparBanners(page) {
  await page.evaluate(() => {
    document
      .querySelectorAll(".training-banner, a.bg-red-600, a.bg-amber-500")
      .forEach((el) => el.remove());
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EDGE });
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });

  let loginAtual = null;
  for (const shot of SHOTS) {
    if (shot.login !== loginAtual) {
      await login(page, shot.login);
      loginAtual = shot.login;
    }
    await page.goto(BASE + shot.url, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector("main", { timeout: 45000 });
    } catch {
      console.log("  SEM <main> em", shot.url, "url atual:", page.url());
    }
    await page.waitForTimeout(4000); // telas com polling assentarem
    await limparBanners(page);
    await page.waitForTimeout(400);

    const box = await page.locator("main").boundingBox();
    const dest = path.join(OUT, shot.file);
    await page.screenshot({
      path: dest,
      clip: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: Math.min(box.height, 860),
      },
    });
    console.log("ok:", shot.file);
  }

  await browser.close();
  console.log("Concluído. PNGs em", OUT);
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
