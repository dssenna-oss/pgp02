import { prisma } from "../../lib/db";

async function main() {
  const dsrs = await prisma.dataSubjectRequest.findMany({
    select: { protocolNumber: true, titularName: true, relatedTaskId: true },
  });
  console.log("DSRs total:", dsrs.length);
  dsrs.forEach((d) =>
    console.log("  ", d.protocolNumber, "|", d.titularName, "| task:", d.relatedTaskId || "sem"),
  );

  // `markers` é String JSON (não array nativo) — usa contains pra buscar
  const tasks = await prisma.task.findMany({
    where: { markers: { contains: "Direitos do Titular" } },
    select: { id: true, title: true, dueDate: true, status: true, priority: true },
  });
  console.log("Tasks DSR total:", tasks.length);
  tasks.forEach((t) =>
    console.log(
      "  ",
      t.title,
      "| prio:",
      t.priority,
      "| due:",
      t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "—",
    ),
  );

  await prisma.$disconnect();
}
main();
