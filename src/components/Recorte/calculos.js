export const DENSIDADE_ACO = 7.85; // g/cm³
const MM_POR_POLEGADA = 25.4;
const LB_FT_POR_KG_M = 0.671969; // 1 kg/m = 0,671969 lb/ft

export function lerNumero(texto) {
  if (typeof texto !== "string" || texto.trim() === "") return NaN;
  return Number(texto.trim().replace(",", "."));
}

export function lerComprimentoMm(texto, unidade) {
  if (typeof texto !== "string" || texto.trim() === "") return NaN;
  let t = texto.trim();
  if (unidade === "mm" && /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) {
    t = t.replace(/\./g, "");
  }
  const valor = Number(t.replace(",", "."));
  return unidade === "m" ? valor * 1000 : valor;
}

export const paraMm = (valor, unidade) =>
  unidade === "pol" ? valor * MM_POR_POLEGADA : valor;

export const massaPorMetro = (odMm, paredeMm, densidade = DENSIDADE_ACO) =>
  (Math.PI * paredeMm * (odMm - paredeMm) * densidade) / 1000;

const parede_ok = (odMm, paredeMm) => paredeMm * 2 < odMm;

export function calcular({
  unidade,
  od,
  parede,
  odMin,
  odMax,
  paredeMin,
  paredeMax,
  unidadeComprimento,
  comprimentoMin,
  comprimentoMax,
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

  const dim = (texto, fallbackMm) => {
    const n = lerNumero(texto);
    return Number.isNaN(n) ? fallbackMm : paraMm(n, unidade);
  };

  const odMm = paraMm(odNum, unidade);
  const paredeMm = paraMm(paredeNum, unidade);
  const odMinMm = dim(odMin, odMm);
  const odMaxMm = dim(odMax, odMm);
  const paredeMinMm = dim(paredeMin, paredeMm);
  const paredeMaxMm = dim(paredeMax, paredeMm);

  if (odMinMm > odMaxMm)
    return { erro: "O diâmetro mínimo não pode ser maior que o máximo." };
  if (paredeMinMm > paredeMaxMm)
    return { erro: "A parede mínima não pode ser maior que a máxima." };
  if (
    !parede_ok(odMm, paredeMm) ||
    !parede_ok(odMinMm, paredeMinMm) ||
    !parede_ok(odMaxMm, paredeMaxMm)
  ) {
    return {
      erro: "A parede precisa ser menor que a metade do diâmetro externo.",
    };
  }

  const kgPorMetro = massaPorMetro(odMm, paredeMm, densidadeNum);

  const kgMin = massaPorMetro(odMinMm, paredeMinMm, densidadeNum);
  const kgMax = massaPorMetro(odMaxMm, paredeMaxMm, densidadeNum);
  const temTolerancia = kgMin !== kgPorMetro || kgMax !== kgPorMetro;

  const resultado = {
    odMm,
    paredeMm,
    diametroInternoMm: odMm - 2 * paredeMm,
    kgPorMetro,
    lbPorPe: kgPorMetro * LB_FT_POR_KG_M,
    faixaKgPorMetro: temTolerancia ? { min: kgMin, max: kgMax } : null,
  };

  const cMinLido = lerComprimentoMm(comprimentoMin, unidadeComprimento);
  const cMaxLido = lerComprimentoMm(comprimentoMax, unidadeComprimento);
  if (Number.isNaN(cMinLido) && Number.isNaN(cMaxLido)) return { resultado };

  const cMin = Number.isNaN(cMinLido) ? cMaxLido : cMinLido;
  const cMax = Number.isNaN(cMaxLido) ? cMinLido : cMaxLido;
  if (cMin <= 0 || cMax <= 0)
    return { erro: "O comprimento precisa ser maior que zero." };
  if (cMin > cMax)
    return { erro: "O comprimento mínimo não pode ser maior que o máximo." };

  const kgA = resultado.faixaKgPorMetro ? kgMin : kgPorMetro;
  const kgB = resultado.faixaKgPorMetro ? kgMax : kgPorMetro;

  resultado.comprimentoMm = { min: cMin, max: cMax };
  resultado.massaPeca = { min: (kgA * cMin) / 1000, max: (kgB * cMax) / 1000 };

  const recorteMm = lerComprimentoMm(recorte, unidadeComprimento);
  if (!Number.isNaN(recorteMm)) {
    if (recorteMm < 0) return { erro: "O recorte não pode ser negativo." };
    if (recorteMm > cMin) {
      return { erro: "O recorte é maior que o comprimento da peça." };
    }
    resultado.recorteMm = recorteMm;
    resultado.comprimentoRestanteMm = {
      min: cMin - recorteMm,
      max: cMax - recorteMm,
    };
    resultado.massaRemovida = {
      min: (kgA * recorteMm) / 1000,
      max: (kgB * recorteMm) / 1000,
    };
    resultado.massaRestante = {
      min: (kgA * (cMin - recorteMm)) / 1000,
      max: (kgB * (cMax - recorteMm)) / 1000,
    };
  }

  return { resultado };
}
