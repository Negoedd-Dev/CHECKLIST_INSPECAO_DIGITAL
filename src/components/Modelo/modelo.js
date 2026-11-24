// Etapas e itens do checklist. Edite à vontade: cada item precisa de um id único.
// ATENÇÃO: estes itens são GENÉRICOS e de exemplo (demonstração). Para uso real,
// substitua pelos itens do procedimento e da norma aplicáveis.
export const ETAPAS = [
  {
    id: "visual",
    titulo: "Inspeção visual",
    itens: [
      { id: "visual-externa", texto: "Superfície externa sem defeitos visíveis" },
      { id: "visual-interna", texto: "Superfície interna sem defeitos visíveis" },
      { id: "visual-pontas", texto: "Extremidades sem danos" },
      { id: "visual-marcacao", texto: "Marcação do tubo legível" },
      { id: "visual-rastreio", texto: "Identificação do tubo confere com o registro" },
    ],
  },
  {
    id: "dimensional",
    titulo: "Inspeção dimensional",
    itens: [
      { id: "dim-de", texto: "Diâmetro externo dentro da tolerância" },
      { id: "dim-parede", texto: "Espessura de parede dentro da tolerância" },
      { id: "dim-comprimento", texto: "Comprimento dentro da faixa especificada" },
      { id: "dim-reto", texto: "Retilineidade conforme" },
    ],
  },
  {
    id: "particulas",
    titulo: "Partículas magnéticas fluorescentes",
    itens: [
      { id: "pm-condicoes", texto: "Condições do ensaio conferidas conforme o procedimento" },
      { id: "pm-indicacoes", texto: "Indicações avaliadas conforme o critério de aceitação" },
      { id: "pm-desmag", texto: "Peça desmagnetizada, quando exigido" },
      { id: "pm-registro", texto: "Resultado do ensaio registrado" },
    ],
  },
  {
    id: "esmerilamento",
    titulo: "Recuperação por esmerilamento",
    itens: [
      { id: "esm-area", texto: "Área esmerilada identificada" },
      { id: "esm-parede", texto: "Espessura de parede remanescente conferida" },
      { id: "esm-reinsp", texto: "Região reinspecionada após o esmerilamento" },
      { id: "esm-acabamento", texto: "Acabamento da região conforme o procedimento" },
    ],
  },
];

export const MOTIVOS_RECORTE = [
  "Ajuste de comprimento",
  "Remoção de parte defeituosa",
  "Outro motivo",
];

export const ESTADOS = [
  { valor: "conforme", rotulo: "Conforme" },
  { valor: "nao", rotulo: "Não conforme" },
  { valor: "na", rotulo: "N/A" },
];