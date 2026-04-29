
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const riskAssessment = await prisma.riskAssessment.update({
      where: { id: params.id },
      data: {
        processName: body.processName,
        riskDescription: body.riskDescription,
        likelihood: body.likelihood,
        impact: body.impact,
        riskLevel: body.riskLevel,
        controls: body.controls,
        recommendations: body.recommendations,
        responsibleArea: body.responsibleArea,
        deadline: body.deadline ? new Date(body.deadline) : null,
        status: body.status
      }
    });

    return NextResponse.json(riskAssessment);
  } catch (error) {
    console.error('Erro ao atualizar análise de risco:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar análise de risco' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await prisma.riskAssessment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Análise de risco excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir análise de risco:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir análise de risco' },
      { status: 500 }
    );
  }
}
