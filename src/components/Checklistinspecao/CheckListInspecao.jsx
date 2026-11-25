import { useState, useEffect, useMemo } from "react";
import "./ChecklistInspecao.css";
import { ETAPAS, ESTADOS, MOTIVOS_RECORTE } from "../Modelo/modelo.js";
import { resumir, resumirEtapa } from "../Avaliacao/avaliacao.js";
import { calcularRecorte } from "../Recorte/recorte.js";
import { relatorioHtml } from "../Relatorio/relatorio.js";

const CHAVE = "checklist-inspecao";

const fmt = (v, casas = 2) =>
  v.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

function hoje() {
  const d = new Date();
  const dois = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

const novoEstado = () => ({
  cabecalho: {
    lote: "",
    tubo: "",
    grau: "",
    od: "",
    parede: "",
    inspetor: "",
    data: hoje(),
  },
  respostas: {},
  recorte: {
    necessario: false,
    motivo: MOTIVOS_RECORTE[0],
    comprimentoAtual: "",
    comprimentoRemover: "",
    obs: "",
  },
});

function carregar() {
  const base = novoEstado();
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (!salvo) return base;
    return {
      cabecalho: { ...base.cabecalho, ...salvo.cabecalho },
      respostas: salvo.respostas ?? {},
      recorte: { ...base.recorte, ...salvo.recorte },
    };
  } catch {
    return base;
  }
}

const ICONES = { aprovada: "✔", andamento: "▲", reprovada: "✖" };

export default function ChecklistInspecao() {
  const [estado, setEstado] = useState(carregar);
  const [obsAbertas, setObsAbertas] = useState({});
  const [copiado, setCopiado] = useState(false);
  const { cabecalho, respostas, recorte } = estado;

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch {}
  }, [estado]);

  const resumo = useMemo(() => resumir(ETAPAS, respostas), [respostas]);
  const recorteCalculo = useMemo(
    () =>
      recorte.necessario
        ? calcularRecorte({
            od: cabecalho.od,
            parede: cabecalho.parede,
            comprimentoAtual: recorte.comprimentoAtual,
            comprimentoRemover: recorte.comprimentoRemover,
          })
        : null,
    [recorte, cabecalho.od, cabecalho.parede],
  );

  const mudaCabecalho = (campo) => (e) =>
    setEstado((s) => ({
      ...s,
      cabecalho: { ...s.cabecalho, [campo]: e.target.value },
    }));

  const mudaRecorte = (campo, valor) =>
    setEstado((s) => ({ ...s, recorte: { ...s.recorte, [campo]: valor } }));

  function responder(id, valor) {
    setEstado((s) => {
      const atual = s.respostas[id] ?? {};
      const proxima = atual.estado === valor ? undefined : valor;
      return {
        ...s,
        respostas: { ...s.respostas, [id]: { ...atual, estado: proxima } },
      };
    });
  }

  function escreverObs(id, texto) {
    setEstado((s) => ({
      ...s,
      respostas: {
        ...s.respostas,
        [id]: { ...(s.respostas[id] ?? {}), obs: texto },
      },
    }));
  }

  function novaInspecao() {
    if (
      window.confirm(
        "Começar uma nova inspeção? As respostas atuais serão apagadas.",
      )
    ) {
      setEstado(novoEstado());
      setObsAbertas({});
    }
  }

  function abrirRelatorio() {
    const janela = window.open("", "_blank");
    if (!janela) {
      window.alert(
        "O navegador bloqueou a janela do relatório. Permita pop-ups para este site e tente de novo.",
      );
      return;
    }
    janela.document.open();
    janela.document.write(
      relatorioHtml({
        cabecalho,
        etapas: ETAPAS,
        respostas,
        recorte,
        recorteCalculo,
        resumo,
      }),
    );
    janela.document.close();
  }

  async function copiar() {
    const linhas = [
      `Inspeção: tubo ${cabecalho.tubo || "—"} | lote ${cabecalho.lote || "—"} | ${cabecalho.grau || "—"}`,
      `Inspetor: ${cabecalho.inspetor || "—"} | Data: ${cabecalho.data.split("-").reverse().join("/")}`,
      `Resultado: ${resumo.resultado.texto} (${resumo.respondidos} de ${resumo.total} itens respondidos)`,
      ...resumo.itensNaoConformes.map(
        (n) =>
          `Não conforme: ${n.etapa} - ${n.item}${n.obs ? ` (${n.obs})` : ""}`,
      ),
    ];
    const r = recorteCalculo?.resultado;
    if (recorte.necessario && r) {
      linhas.push(
        `Recorte (${recorte.motivo}): remover ${fmt(r.removerMm, 0)} mm de ${fmt(r.atualMm, 0)} mm; sobra ${fmt(r.restanteMm, 0)} mm` +
          (r.massaRemovida !== undefined
            ? `; massa removida ${fmt(r.massaRemovida)} kg`
            : ""),
      );
    }
    try {
      await navigator.clipboard.writeText(linhas.join("\n"));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {}
  }

  const campo = (nome, rotulo, extra = {}) => (
    <label>
      {rotulo}
      <input
        value={cabecalho[nome]}
        onChange={mudaCabecalho(nome)}
        {...extra}
      />
    </label>
  );

  return (
    <section className="ck" aria-label="Checklist de inspeção digital">
      <h2>Checklist de inspeção digital</h2>
      <p className="ck-demo">
        Protótipo de demonstração, com itens genéricos. Os dados ficam salvos só
        neste navegador.
      </p>

      <fieldset className="ck-cabecalho">
        <legend>Identificação</legend>
        {campo("lote", "Lote / corrida")}
        {campo("tubo", "Nº do tubo")}
        {campo("grau", "Material / grau", { placeholder: "Ex.: L80" })}
        {campo("od", "Diâmetro externo nominal (mm)", { inputMode: "decimal" })}
        {campo("parede", "Parede nominal (mm)", { inputMode: "decimal" })}
        {campo("inspetor", "Inspetor")}
        {campo("data", "Data", { type: "date" })}
      </fieldset>

      <div
        className={`ck-resultado ck-${resumo.resultado.nivel}`}
        role="status"
        aria-live="polite"
      >
        <div>
          <span className="ck-resultado-rotulo">Resultado</span>
          <strong>
            <span aria-hidden="true">{ICONES[resumo.resultado.nivel]}</span>{" "}
            {resumo.resultado.texto}
          </strong>
        </div>
        <label className="ck-progresso">
          {resumo.respondidos} de {resumo.total} itens respondidos
          <progress value={resumo.respondidos} max={resumo.total || 1} />
        </label>
      </div>

      {ETAPAS.map((etapa, n) => {
        const r = resumirEtapa(etapa, respostas);
        return (
          <fieldset key={etapa.id} className="ck-etapa">
            <legend>
              {n + 1}. {etapa.titulo}
              <small>
                {r.respondidos}/{r.total}
                {r.naoConformes > 0 &&
                  ` · ${r.naoConformes} não conforme${r.naoConformes > 1 ? "s" : ""}`}
              </small>
            </legend>

            <ul>
              {etapa.itens.map((item) => {
                const resp = respostas[item.id] ?? {};
                const mostraObs =
                  resp.estado === "nao" || resp.obs || obsAbertas[item.id];
                return (
                  <li
                    key={item.id}
                    className={
                      resp.estado ? `ck-item ck-item-${resp.estado}` : "ck-item"
                    }
                  >
                    <span className="ck-texto">{item.texto}</span>
                    <div
                      className="ck-opcoes"
                      role="group"
                      aria-label={`Situação: ${item.texto}`}
                    >
                      {ESTADOS.map((e) => (
                        <button
                          key={e.valor}
                          type="button"
                          className={`ck-op ck-op-${e.valor}`}
                          aria-pressed={resp.estado === e.valor}
                          onClick={() => responder(item.id, e.valor)}
                        >
                          {resp.estado === e.valor &&
                            e.valor === "conforme" &&
                            "✔ "}
                          {resp.estado === e.valor && e.valor === "nao" && "✖ "}
                          {e.rotulo}
                        </button>
                      ))}
                      {!mostraObs && (
                        <button
                          type="button"
                          className="ck-link"
                          onClick={() =>
                            setObsAbertas((o) => ({ ...o, [item.id]: true }))
                          }
                        >
                          + obs.
                        </button>
                      )}
                    </div>
                    {mostraObs && (
                      <input
                        className="ck-obs"
                        value={resp.obs ?? ""}
                        onChange={(e) => escreverObs(item.id, e.target.value)}
                        placeholder={
                          resp.estado === "nao"
                            ? "Descreva a não conformidade"
                            : "Observação"
                        }
                        aria-label={`Observação: ${item.texto}`}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}

      <fieldset className="ck-etapa">
        <legend>{ETAPAS.length + 1}. Apontamento de recorte</legend>
        <label className="ck-marca">
          <input
            type="checkbox"
            checked={recorte.necessario}
            onChange={(e) => mudaRecorte("necessario", e.target.checked)}
          />
          Esta peça precisa de recorte
        </label>

        {recorte.necessario && (
          <div className="ck-recorte">
            <label>
              Motivo
              <select
                value={recorte.motivo}
                onChange={(e) => mudaRecorte("motivo", e.target.value)}
              >
                {MOTIVOS_RECORTE.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label>
              Comprimento atual (mm)
              <input
                inputMode="decimal"
                value={recorte.comprimentoAtual}
                onChange={(e) =>
                  mudaRecorte("comprimentoAtual", e.target.value)
                }
              />
            </label>
            <label>
              Comprimento a remover (mm)
              <input
                inputMode="decimal"
                value={recorte.comprimentoRemover}
                onChange={(e) =>
                  mudaRecorte("comprimentoRemover", e.target.value)
                }
              />
            </label>
            <label className="ck-largo">
              Observação
              <input
                value={recorte.obs}
                onChange={(e) => mudaRecorte("obs", e.target.value)}
              />
            </label>

            <div className="ck-largo" aria-live="polite">
              {recorteCalculo?.erro && (
                <p className="ck-erro">{recorteCalculo.erro}</p>
              )}
              {recorteCalculo?.resultado && (
                <p className="ck-calculo">
                  Restam{" "}
                  <strong>
                    {fmt(recorteCalculo.resultado.restanteMm, 0)} mm
                  </strong>
                  {recorteCalculo.resultado.massaRemovida !== undefined ? (
                    <>
                      . Massa teórica removida{" "}
                      <strong>
                        {fmt(recorteCalculo.resultado.massaRemovida)} kg
                      </strong>
                      ; restante{" "}
                      <strong>
                        {fmt(recorteCalculo.resultado.massaRestante)} kg
                      </strong>
                      .
                    </>
                  ) : (
                    <>
                      . Informe diâmetro e parede na identificação para ver a
                      massa.
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </fieldset>

      <div className="ck-acoes">
        <button type="button" className="ck-principal" onClick={abrirRelatorio}>
          Imprimir / salvar em PDF
        </button>
        <button type="button" onClick={copiar}>
          {copiado ? "Copiado!" : "Copiar resumo"}
        </button>
        <button type="button" onClick={novaInspecao}>
          Nova inspeção
        </button>
      </div>
    </section>
  );
}
