
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

    const riskAssessments = await prisma.riskAssessment.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(riskAssessments);
  } catch (error) {
    console.error('Erro ao buscar análises de risco:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar análises de risco' },
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

    const riskAssessment = await prisma.riskAssessment.create({
      data: {
        companyId: user.companyId,
        processName: body.processName,
        riskDescription: body.riskDescription,
        likelihood: body.likelihood,
        impact: body.impact,
        riskLevel: body.riskLevel,
        controls: body.controls,
        recommendations: body.recommendations,
        responsibleArea: body.responsibleArea,
        deadline: body.deadline ? new Date(body.deadline) : null,
        status: body.status || 'Pendente'
      }
    });

    return NextResponse.json(riskAssessment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar análise de risco:', error);
    return NextResponse.json(
      { error: 'Erro ao criar análise de risco' },
      { status: 500 }
    );
  }
}
