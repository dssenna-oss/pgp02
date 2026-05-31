import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PolicyEditorClient } from "@/components/policy-editor-client";

export const dynamic = "force-dynamic";

export default async function PolicyEditorPage({ params }: { params: { id: string } }) {
  const policy = await prisma.policy.findUnique({ where: { id: params.id } });
  if (!policy) notFound();

  return (
    <div className="max-w-6xl mx-auto">
      <PolicyEditorClient
        policy={{
          id: policy.id,
          type: policy.type,
          title: policy.title,
          slug: policy.slug,
          status: policy.status,
          currentContent: policy.currentContent,
          currentVersion: policy.currentVersion,
          publishedAt: policy.publishedAt ? policy.publishedAt.toISOString() : null,
          publishedBy: policy.publishedBy,
        }}
      />
    </div>
  );
}
