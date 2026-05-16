// Banner permanente "AMBIENTE DE TREINAMENTO"
// Renderizado no topo de TODAS as telas — autenticadas ou não.

export function TrainingBanner() {
  return (
    <div className="training-banner text-yellow-900 text-xs font-bold py-1 px-3 text-center tracking-wider">
      ⚠ AMBIENTE DE TREINAMENTO — NÃO USAR PARA DADOS REAIS · PGP Treinamento
    </div>
  );
}
