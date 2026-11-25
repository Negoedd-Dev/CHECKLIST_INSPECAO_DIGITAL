import {
  massaPorMetro,
  lerNumero,
  lerComprimentoMm,
  DENSIDADE_ACO,
} from "../calculos/calculos.js";

export const DENSIDADE_ACO = 7.85; // g/cm³
const MM_POR_POLEGADA = 25.4;
const LB_FT_POR_KG_M = 0.671969; // 1 kg/m = 0,671969 lb/ft

export function lerNumero(texto) {
  if (typeof texto !== "string" || texto.trim() === "") return NaN;
  return Number(texto.trim().replace(",", "."));
}

export const paraMm = (valor, unidade) =>
  unidade === "pol" ? valor * MM_POR_POLEGADA : valor;

export const massaPorMetro = (odMm, paredeMm, densidade = DENSIDADE_ACO) =>
  (Math.PI * paredeMm * (odMm - paredeMm) * densidade) / 1000;

export function calcular({
  od,
  parede,
  unidade,
  comprimento,
  recorte,
  densidade,
}) {
  const odNum = lerNumero(od);
  const paredeNum = lerNumero(parede);
  const densidadeNum = lerNumero(densidade);

  if (Number.isNaN(odNum) || Number.isNaN(paredeNum))
    return { resultado: null };
  if (odNum <= 0 || paredeNum <= 0) {
    return { erro: "Diâmetro e parede precisam ser maiores que zero." };
  }
  if (Number.isNaN(densidadeNum) || densidadeNum <= 0) {
    return { erro: "Informe uma densidade válida (g/cm³)." };
  }

  const odMm = paraMm(odNum, unidade);
  const paredeMm = paraMm(paredeNum, unidade);

  if (paredeMm * 2 >= odMm) {
    return {
      erro: "A parede precisa ser menor que a metade do diâmetro externo.",
    };
  }

  const kgPorMetro = massaPorMetro(odMm, paredeMm, densidadeNum);
  const resultado = {
    odMm,
    paredeMm,
    diametroInternoMm: odMm - 2 * paredeMm,
    kgPorMetro,
    lbPorPe: kgPorMetro * LB_FT_POR_KG_M,
  };

  const compNum = lerNumero(comprimento);
  if (!Number.isNaN(compNum)) {
    if (compNum <= 0)
      return { erro: "O comprimento precisa ser maior que zero." };
    resultado.comprimento = compNum;
    resultado.massaPeca = kgPorMetro * compNum;

    const recorteNum = lerNumero(recorte);
    if (!Number.isNaN(recorteNum)) {
      if (recorteNum < 0) return { erro: "O recorte não pode ser negativo." };
      if (recorteNum > compNum) {
        return { erro: "O recorte é maior que o comprimento da peça." };
      }
      resultado.recorte = recorteNum;
      resultado.comprimentoRestante = compNum - recorteNum;
      resultado.massaRemovida = kgPorMetro * recorteNum;
      resultado.massaRestante = kgPorMetro * (compNum - recorteNum);
    }
  }

  return { resultado };
}
