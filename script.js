async function carregarJSON(caminho) {
  const resposta = await fetch(caminho);
  return await resposta.json();
}

function statusClasse(status) {
  if (!status) return "status-encerrado";
  return status.toLowerCase().includes("vigente") ? "status-vigente" : "status-encerrado";
}

function linhaArquivo(caminho) {
  if (!caminho || caminho.trim() === "") {
    return "Não anexado";
  }

  return `<a href="${caminho}" target="_blank" class="botao">Acessar</a>`;
}

function preencherRecebidas(dados) {
  const tabela = document.getElementById("tabelaRecebidas");

  if (!dados.length) {
    tabela.innerHTML = `
      <tr>
        <td colspan="8" class="linha-vazia">
          Não houve transferências recebidas por meio de convênios, termos ou ajustes neste período.
        </td>
      </tr>
    `;
    return;
  }

  tabela.innerHTML = dados.map(item => `
    <tr>
      <td>${item.numero}</td>
      <td>${item.origem}</td>
      <td>${item.objeto}</td>
      <td>${item.vigencia}</td>
      <td>${item.valorTotal}</td>
      <td>${item.valorRecebido}</td>
      <td><span class="status ${statusClasse(item.situacao)}">${item.situacao}</span></td>
      <td>${linhaArquivo(item.arquivo)}</td>
    </tr>
  `).join("");
}

function preencherRealizadas(dados) {
  const tabela = document.getElementById("tabelaRealizadas");

  if (!dados.length) {
    tabela.innerHTML = `
      <tr>
        <td colspan="8" class="linha-vazia">
          Não houve transferências realizadas por meio de convênios, termos ou ajustes neste período.
        </td>
      </tr>
    `;
    return;
  }

  tabela.innerHTML = dados.map(item => `
    <tr>
      <td>${item.numero}</td>
      <td>${item.beneficiario}</td>
      <td>${item.objeto}</td>
      <td>${item.vigencia}</td>
      <td>${item.valorTotal}</td>
      <td>${item.valorConcedido}</td>
      <td><span class="status ${statusClasse(item.situacao)}">${item.situacao}</span></td>
      <td>${linhaArquivo(item.arquivo)}</td>
    </tr>
  `).join("");
}

function preencherSemRepasse(dados) {
  const tabela = document.getElementById("tabelaSemRepasse");

  if (!dados.length) {
    tabela.innerHTML = `
      <tr>
        <td colspan="7" class="linha-vazia">
          Não houve acordos, termos ou ajustes sem transferência de recursos financeiros neste período.
        </td>
      </tr>
    `;
    return;
  }

  tabela.innerHTML = dados.map(item => `
    <tr>
      <td>${item.numero}</td>
      <td>${item.partes}</td>
      <td>${item.objeto}</td>
      <td>${item.vigencia}</td>
      <td>${item.obrigacoes}</td>
      <td><span class="status ${statusClasse(item.situacao)}">${item.situacao}</span></td>
      <td>${linhaArquivo(item.arquivo)}</td>
    </tr>
  `).join("");
}

async function iniciarPagina() {
  const recebidas = await carregarJSON("dados/transferencias-recebidas.json");
  const realizadas = await carregarJSON("dados/transferencias-realizadas.json");
  const semRepasse = await carregarJSON("dados/acordos-sem-repasse.json");

  preencherRecebidas(recebidas);
  preencherRealizadas(realizadas);
  preencherSemRepasse(semRepasse);
}

function filtrarTabelas() {
  const termo = document.getElementById("campoBusca").value.toLowerCase();
  const linhas = document.querySelectorAll("tbody tr");

  linhas.forEach(linha => {
    const texto = linha.innerText.toLowerCase();
    linha.style.display = texto.includes(termo) ? "" : "none";
  });
}

iniciarPagina();

const hoje = new Date();

const dataFormatada =
  hoje.toLocaleDateString("pt-BR") +
  " às " +
  hoje.toLocaleTimeString("pt-BR", {
    hour: '2-digit',
    minute: '2-digit'
  });

document.getElementById("dataHoje").innerHTML = dataFormatada;

function obterDadosDasTabelas() {
  const dados = [];

  document.querySelectorAll(".bloco").forEach(bloco => {
    const titulo = bloco.querySelector("h3")?.innerText || "Seção";
    const tabela = bloco.querySelector("table");

    if (!tabela) return;

    const cabecalhos = Array.from(tabela.querySelectorAll("thead th"))
      .map(th => th.innerText.trim());

    tabela.querySelectorAll("tbody tr").forEach(tr => {
      if (tr.style.display === "none") return;

      const colunas = Array.from(tr.querySelectorAll("td"))
        .map(td => td.innerText.trim());

      if (colunas.length === cabecalhos.length) {
        const item = { secao: titulo };

        cabecalhos.forEach((cabecalho, index) => {
          item[cabecalho] = colunas[index];
        });

        dados.push(item);
      }
    });
  });

  return dados;
}

function baixarArquivo(conteudo, nomeArquivo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  link.click();
}

function exportarCSV() {
  const dados = obterDadosDasTabelas();

  if (!dados.length) return alert("Nenhum dado disponível para exportação.");

  const colunas = Object.keys(dados[0]);

  const linhas = [
    colunas.join(";"),
    ...dados.map(item =>
      colunas.map(coluna =>
        `"${String(item[coluna] ?? "").replace(/"/g, '""')}"`
      ).join(";")
    )
  ];

  baixarArquivo(
    "\uFEFF" + linhas.join("\n"),
    "convenios-transferencias-cimop.csv",
    "text/csv;charset=utf-8;"
  );
}

function exportarJSON() {
  const dados = obterDadosDasTabelas();

  baixarArquivo(
    JSON.stringify(dados, null, 2),
    "convenios-transferencias-cimop.json",
    "application/json;charset=utf-8;"
  );
}

function exportarXML() {
  const dados = obterDadosDasTabelas();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<registros>\n`;

  dados.forEach(item => {
    xml += "  <registro>\n";

    Object.entries(item).forEach(([chave, valor]) => {
      const tag = chave
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();

      xml += `    <${tag}>${String(valor).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</${tag}>\n`;
    });

    xml += "  </registro>\n";
  });

  xml += "</registros>";

  baixarArquivo(
    xml,
    "convenios-transferencias-cimop.xml",
    "application/xml;charset=utf-8;"
  );
}

function exportarXLSX() {
  const dados = obterDadosDasTabelas();

  const planilha = XLSX.utils.json_to_sheet(dados);
  const pasta = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(pasta, planilha, "Convênios");

  XLSX.writeFile(pasta, "convenios-transferencias-cimop.xlsx");
}

function exportarPDF() {
  const dados = obterDadosDasTabelas();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  doc.setFontSize(14);
  doc.text("CIMOP - Convênios, Acordos e Transferências", 14, 15);

  if (!dados.length) {
    doc.text("Nenhum dado disponível para exportação.", 14, 30);
    doc.save("convenios-transferencias-cimop.pdf");
    return;
  }

  const colunas = Object.keys(dados[0]);
  const linhas = dados.map(item => colunas.map(coluna => item[coluna]));

  doc.autoTable({
    head: [colunas],
    body: linhas,
    startY: 25,
    styles: {
      fontSize: 7,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [7, 55, 99]
    }
  });

  doc.save("convenios-transferencias-cimop.pdf");
}
