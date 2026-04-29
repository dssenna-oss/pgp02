
import { NextRequest, NextResponse } from 'next/server';
import { ensureUserHasCompany } from "@/lib/ensure-company";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await ensureUserHasCompany(session.user.email);

    const gapAnalyses = await prisma.gapAnalysis.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(gapAnalyses);
  } catch (error) {
    console.error('Erro ao buscar análises GAP:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar análises GAP' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await ensureUserHasCompany(session.user.email);

    const body = await request.json();

    const gapAnalysis = await prisma.gapAnalysis.create({
      data: {
        companyId: user.companyId,
        requirement: body.requirement,
        currentStatus: body.currentStatus,
        evidence: body.evidence || '',
        gap: body.gap || '',
        recommendation: body.recommendation || '',
        priority: body.priority,
        responsibleArea: body.responsibleArea,
        deadline: body.deadline ? new Date(body.deadline) : null
      }
    });

    return NextResponse.json(gapAnalysis, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar análise GAP:', error);
    return NextResponse.json(
      { error: 'Erro ao criar análise GAP' },
      { status: 500 }
    );
  }
}
