// Regras do checklist (sem nada de tela, para poder testar).
// respostas: { [idDoItem]: { estado: "conforme" | "nao" | "na", obs: "" } }

export function resumirEtapa(etapa, respostas) {
  let total = 0;
  let respondidos = 0;
  let naoConformes = 0;
  for (const item of etapa.itens) {
    const estado = respostas[item.id]?.estado;
    if (estado === "na") continue; // não se aplica: sai da conta
    total += 1;
    if (estado === "conforme" || estado === "nao") respondidos += 1;
    if (estado === "nao") naoConformes += 1;
  }
  return { total, respondidos, naoConformes };
}

export function resumir(etapas, respostas) {
  let total = 0;
  let respondidos = 0;
  let naoConformes = 0;
  let naoSeAplica = 0;
  const itensNaoConformes = [];

  for (const etapa of etapas) {
    for (const item of etapa.itens) {
      const resposta = respostas[item.id];
      if (resposta?.estado === "na") {
        naoSeAplica += 1;
        continue;
      }
      total += 1;
      if (resposta?.estado === "conforme") respondidos += 1;
      if (resposta?.estado === "nao") {
        respondidos += 1;
        naoConformes += 1;
        itensNaoConformes.push({
          etapa: etapa.titulo,
          item: item.texto,
          obs: (resposta.obs ?? "").trim(),
        });
      }
    }
  }

  const pendentes = total - respondidos;

  let resultado;
  if (naoConformes > 0) {
    resultado = { nivel: "reprovada", texto: "Não conforme: ação necessária" };
  } else if (pendentes > 0 || total === 0) {
    resultado = {
      nivel: "andamento",
      texto: total === 0 ? "Nenhum item avaliado" : `Em andamento: ${pendentes} ${pendentes === 1 ? "item pendente" : "itens pendentes"}`,
    };
  } else {
    resultado = { nivel: "aprovada", texto: "Conforme" };
  }

  return { total, respondidos, pendentes, naoConformes, naoSeAplica, itensNaoConformes, resultado };
}