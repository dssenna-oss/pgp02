export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VALID_MARKER_COLORS, parseMarkers } from "@/lib/tarefas-types";

/**
 * PATCH  /api/marcadores/[id] — renomeia ou troca a cor (só dono).
 * DELETE /api/marcadores/[id] — exclui o marcador (só dono).
 *
 * Ao excluir, o nome também é removido das tarefas que o referenciavam
 * (campo `markers` em JSON), pra manter consistência visual.
 */

async function loadMarkerAndCheckOwnership(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return { error: NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 }) };
  }
  const marker = await prisma.taskMarker.findUnique({ where: { id } });
  if (!marker) {
    return { error: NextResponse.json({ error: "Marcador não encontrado" }, { status: 404 }) };
  }
  if (marker.userId !== user.id) {
    return {
      error: NextResponse.json(
        { error: "Você não é o dono deste marcador" },
        { status: 403 }
      ),
    };
  }
  return { user, marker };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadMarkerAndCheckOwnership(id);
  if ("error" in r) return r.error;
  const { user, marker } = r;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data: any = {};
  let oldName: string | null = null;
  let newName: string | null = null;

  if (typeof body.name === "string") {
    const n = body.name.trim().slice(0, 60);
    if (n.length < 2) {
      return NextResponse.json(
        { error: "Nome inválido (mínimo 2 caracteres)" },
        { status: 400 }
      );
    }
    if (n !== marker.name) {
      oldName = marker.name;
      newName = n;
      data.name = n;
    }
  }
  if (body.color && VALID_MARKER_COLORS.has(body.color)) {
    data.color = body.color;
  }

  // Se renomear: atualiza tarefas que referenciam o nome antigo.
  if (oldName && newName) {
    const tasksToUpdate = await prisma.task.findMany({
      where: { userId: user.id, markers: { contains: oldName } },
      select: { id: true, markers: true },
    });
    const ops: any[] = [];
    for (const t of tasksToUpdate) {
      const arr = parseMarkers(t.markers);
      if (!arr.includes(oldName)) continue;
      const updated = arr.map((m) => (m === oldName ? newName! : m));
      ops.push(
        prisma.task.update({
          where: { id: t.id },
          data: { markers: JSON.stringify(updated) },
        })
      );
    }
    if (ops.length > 0) {
      try {
        await prisma.$transaction([
          ...ops,
          prisma.taskMarker.update({ where: { id }, data }),
        ]);
        const updated = await prisma.taskMarker.findUnique({ where: { id } });
        return NextResponse.json({ marker: updated });
      } catch (err: any) {
        if (err?.code === "P2002") {
          return NextResponse.json(
            { error: "Você já tem um marcador com esse nome" },
            { status: 409 }
          );
        }
        throw err;
      }
    }
  }

  try {
    const updated = await prisma.taskMarker.update({ where: { id }, data });
    return NextResponse.json({ marker: updated });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Você já tem um marcador com esse nome" },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadMarkerAndCheckOwnership(id);
  if ("error" in r) return r.error;
  const { user, marker } = r;

  // Remove o marcador do JSON das tarefas que o referenciavam.
  const tasksToUpdate = await prisma.task.findMany({
    where: { userId: user.id, markers: { contains: marker.name } },
    select: { id: true, markers: true },
  });
  const ops: any[] = [];
  for (const t of tasksToUpdate) {
    const arr = parseMarkers(t.markers);
    if (!arr.includes(marker.name)) continue;
    const filtered = arr.filter((m) => m !== marker.name);
    ops.push(
      prisma.task.update({
        where: { id: t.id },
        data: { markers: filtered.length > 0 ? JSON.stringify(filtered) : null },
      })
    );
  }
  ops.push(prisma.taskMarker.delete({ where: { id } }));
  await prisma.$transaction(ops);

  return NextResponse.json({ ok: true });
}
