import { ESTADOS } from "../Modelo/modelo.js";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const rotuloEstado = (estado) =>
  ESTADOS.find((e) => e.valor === estado)?.rotulo ?? "Pendente";

const fmt = (v, casas = 2) =>
  v.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

const dataBr = (iso) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : iso;

export function relatorioHtml({
  cabecalho,
  etapas,
  respostas,
  recorte,
  recorteCalculo,
  resumo,
}) {
  const c = cabecalho;
  const campos = [
    ["Lote / corrida", c.lote],
    ["Nº do tubo", c.tubo],
    ["Material / grau", c.grau],
    ["Diâmetro externo nominal (mm)", c.od],
    ["Parede nominal (mm)", c.parede],
    ["Inspetor", c.inspetor],
    ["Data", dataBr(c.data)],
  ];

  const blocoEtapas = etapas
    .map(
      (etapa) => `
      <h3>${esc(etapa.titulo)}</h3>
      <table>
        <thead><tr><th>Item</th><th>Situação</th><th>Observação</th></tr></thead>
        <tbody>
          ${etapa.itens
            .map((item) => {
              const r = respostas[item.id] ?? {};
              return `<tr><td>${esc(item.texto)}</td><td>${esc(rotuloEstado(r.estado))}</td><td>${esc(r.obs ?? "")}</td></tr>`;
            })
            .join("")}
        </tbody>
      </table>`,
    )
    .join("");

  let blocoRecorte = "";
  if (recorte.necessario) {
    const calc = recorteCalculo?.resultado;
    blocoRecorte = `
      <h3>Apontamento de recorte</h3>
      <table>
        <tbody>
          <tr><th>Motivo</th><td>${esc(recorte.motivo)}</td></tr>
          <tr><th>Comprimento atual</th><td>${calc ? esc(fmt(calc.atualMm, 0)) + " mm" : esc(recorte.comprimentoAtual)}</td></tr>
          <tr><th>Comprimento a remover</th><td>${calc ? esc(fmt(calc.removerMm, 0)) + " mm" : esc(recorte.comprimentoRemover)}</td></tr>
          ${calc ? `<tr><th>Comprimento restante</th><td>${esc(fmt(calc.restanteMm, 0))} mm</td></tr>` : ""}
          ${
            calc?.massaRemovida !== undefined
              ? `<tr><th>Massa teórica removida</th><td>${esc(fmt(calc.massaRemovida))} kg</td></tr>
          <tr><th>Massa teórica restante</th><td>${esc(fmt(calc.massaRestante))} kg</td></tr>`
              : ""
          }
          ${recorte.obs ? `<tr><th>Observação</th><td>${esc(recorte.obs)}</td></tr>` : ""}
        </tbody>
      </table>`;
  }

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Relatório de inspeção</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 24px; font-size: 13px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h3 { margin: 18px 0 6px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  th, td { border: 1px solid #888; padding: 4px 8px; text-align: left; vertical-align: top; }
  th { background: #eee; }
  .resultado { margin: 12px 0; padding: 8px 12px; border: 2px solid #111; font-size: 15px; font-weight: bold; }
  .aviso { margin-top: 18px; font-size: 11px; color: #555; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>
  <h1>Relatório de inspeção</h1>
  <table><tbody>
    ${campos.map(([nome, valor]) => `<tr><th>${esc(nome)}</th><td>${esc(valor)}</td></tr>`).join("")}
  </tbody></table>
  <div class="resultado">Resultado: ${esc(resumo.resultado.texto)}</div>
  <p>Itens respondidos: ${resumo.respondidos} de ${resumo.total} (não se aplica: ${resumo.naoSeAplica}). Não conformes: ${resumo.naoConformes}.</p>
  ${blocoEtapas}
  ${blocoRecorte}
  <p class="aviso">Documento de demonstração gerado pelo checklist de inspeção. Os itens são genéricos e não substituem o procedimento nem a norma aplicáveis.</p>
  <script>window.addEventListener("load", function () { window.print(); });</script>
</body>
</html>`;
}
