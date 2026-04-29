
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

    const gapAnalysis = await prisma.gapAnalysis.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json(gapAnalysis);
  } catch (error) {
    console.error('Erro ao atualizar análise GAP:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar análise GAP' },
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

    await prisma.gapAnalysis.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Análise GAP excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir análise GAP:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir análise GAP' },
      { status: 500 }
    );
  }
}
