import {
  massaPorMetro,
  lerNumero,
  lerComprimentoMm,
  DENSIDADE_ACO,
} from "./calculos";

export function calcularRecorte({
  od,
  parede,
  comprimentoAtual,
  comprimentoRemover,
}) {
  const atual = lerComprimentoMm(comprimentoAtual, "mm");
  const remover = lerComprimentoMm(comprimentoRemover, "mm");

  if (Number.isNaN(atual) || Number.isNaN(remover)) return { vazio: true };
  if (atual <= 0)
    return { erro: "O comprimento atual precisa ser maior que zero." };
  if (remover < 0)
    return { erro: "O comprimento a remover não pode ser negativo." };
  if (remover > atual)
    return {
      erro: "O comprimento a remover é maior que o comprimento da peça.",
    };

  const restanteMm = atual - remover;
  const resultado = { atualMm: atual, removerMm: remover, restanteMm };

  const odMm = lerNumero(od);
  const paredeMm = lerNumero(parede);
  if (
    !Number.isNaN(odMm) &&
    !Number.isNaN(paredeMm) &&
    odMm > 0 &&
    paredeMm > 0
  ) {
    if (paredeMm * 2 >= odMm) {
      return {
        erro: "A parede precisa ser menor que a metade do diâmetro externo.",
      };
    }
    const kgPorMetro = massaPorMetro(odMm, paredeMm, DENSIDADE_ACO);
    resultado.massaRemovida = (kgPorMetro * remover) / 1000;
    resultado.massaRestante = (kgPorMetro * restanteMm) / 1000;
  }
  return { resultado };
}
