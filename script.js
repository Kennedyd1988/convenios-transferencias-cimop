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
