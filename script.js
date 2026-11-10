// FASE 1: Modelagem dos dados (Classe Base)
class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = parseFloat(preco);
        this.quantidade = parseInt(quantidade, 10);
    }

    calcularSubtotal() {
        return this.preco * this.quantidade;
    }
}

// FASE 2: Gerenciamento de Estado
const listaDeProdutos = [];
// null = Modo Cadastro; número = Modo Edição (índice na lista principal).
let indiceEdicao = null;

const CHAVE_STORAGE = "sistema_estoque_produtos";

// FASE 3: Captura de Elementos do DOM
const formProduto = document.getElementById("produto-form");
const campoNome = document.getElementById("nome");
const campoPreco = document.getElementById("preco");
const campoQuantidade = document.getElementById("quantidade");
const btnLimparTudo = document.getElementById("limpar-tabela");
const totalEstoqueEl = document.getElementById("total-estoque");
const btnSalvar = document.getElementById("btn-salvar");
const btnCancelar = document.getElementById("btn-cancelar");
const campoBusca = document.getElementById("campo-busca");

// V5: elementos de feedback e modais
const mensagemErroEl = document.getElementById("mensagem-erro");
const toastEl = document.getElementById("toast");

const modalConfirmacao = document.getElementById("modal-confirmacao");
const modalConfirmacaoTitulo = document.getElementById("modal-confirmacao-titulo");
const modalConfirmacaoTexto = document.getElementById("modal-confirmacao-texto");
const modalBtnCancelar = document.getElementById("modal-btn-cancelar");
const modalBtnConfirmar = document.getElementById("modal-btn-confirmar");

const btnBootstrap = document.getElementById("btn-bootstrap");
const modalBootstrap = document.getElementById("modal-bootstrap");
const modalBootstrapTitulo = document.getElementById("modal-bootstrap-titulo");
const modalBootstrapCorpo = document.getElementById("modal-bootstrap-corpo");
const modalBootstrapFechar = document.getElementById("modal-bootstrap-fechar");

// ---------------------------------------------------------------
// V5: Mensagens inline (erros de validação) e toast (avisos)
// ---------------------------------------------------------------
function limparErro() {
    mensagemErroEl.hidden = true;
    mensagemErroEl.textContent = "";
    [campoNome, campoPreco, campoQuantidade].forEach((campo) => {
        campo.classList.remove("campo-invalido");
        campo.removeAttribute("aria-invalid");
    });
}

function mostrarErro(mensagem, campo) {
    limparErro();
    mensagemErroEl.textContent = mensagem;
    mensagemErroEl.hidden = false;

    if (campo) {
        campo.classList.add("campo-invalido");
        campo.setAttribute("aria-invalid", "true");
        campo.focus();
    }
}

let timerToast = null;

function mostrarToast(mensagem, tipo = "sucesso") {
    clearTimeout(timerToast);
    toastEl.textContent = mensagem;
    toastEl.className = `toast toast-${tipo}`;
    toastEl.hidden = false;

    timerToast = setTimeout(() => {
        toastEl.hidden = true;
    }, 3500);
}

// Some o erro assim que o usuário começa a corrigir o campo.
[campoNome, campoPreco, campoQuantidade].forEach((campo) => {
    campo.addEventListener("input", limparErro);
});

// ---------------------------------------------------------------
// V5: Controle genérico de modais
// ---------------------------------------------------------------
let focoAnterior = null;

function abrirModal(overlay) {
    focoAnterior = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("modal-aberto");
}

function fecharModal(overlay) {
    overlay.hidden = true;
    document.body.classList.remove("modal-aberto");
    if (focoAnterior && typeof focoAnterior.focus === "function") {
        focoAnterior.focus();
    }
}

// Mantém o Tab dentro do modal enquanto ele está aberto.
function prenderFoco(evento, botoes) {
    if (evento.key !== "Tab") return;

    const primeiro = botoes[0];
    const ultimo = botoes[botoes.length - 1];

    if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
    }
}

// ---------------------------------------------------------------
// V5: Modal de confirmação (substitui confirm)
// Retorna uma Promise<boolean>: true = Confirmar, false = Cancelar.
// O código que chama usa "await" e só continua após a resposta.
// ---------------------------------------------------------------
function confirmarAcao({ titulo, mensagem, textoConfirmar = "Confirmar" }) {
    return new Promise((resolve) => {
        modalConfirmacaoTitulo.textContent = titulo;
        modalConfirmacaoTexto.textContent = mensagem;
        modalBtnConfirmar.textContent = textoConfirmar;

        const botoes = [modalBtnCancelar, modalBtnConfirmar];

        function finalizar(resultado) {
            modalBtnConfirmar.removeEventListener("click", aoConfirmar);
            modalBtnCancelar.removeEventListener("click", aoCancelar);
            modalConfirmacao.removeEventListener("click", aoClicarFora);
            document.removeEventListener("keydown", aoTeclar);
            fecharModal(modalConfirmacao);
            resolve(resultado);
        }

        function aoConfirmar() { finalizar(true); }
        function aoCancelar() { finalizar(false); }
        function aoClicarFora(evento) {
            if (evento.target === modalConfirmacao) finalizar(false);
        }
        function aoTeclar(evento) {
            if (evento.key === "Escape") finalizar(false);
            prenderFoco(evento, botoes);
        }

        modalBtnConfirmar.addEventListener("click", aoConfirmar);
        modalBtnCancelar.addEventListener("click", aoCancelar);
        modalConfirmacao.addEventListener("click", aoClicarFora);
        document.addEventListener("keydown", aoTeclar);

        abrirModal(modalConfirmacao);
        // Foco inicial no "Cancelar": ação destrutiva exige escolha consciente.
        modalBtnCancelar.focus();
    });
}

// ---------------------------------------------------------------
// V5: Modal "Conceito Bootstrap" (conteúdo dinâmico)
// ---------------------------------------------------------------
const conteudoBootstrap = {
    titulo: "Como o Bootstrap aceleraria a nossa interface",
    intro:
        "Bootstrap é uma biblioteca de CSS e JavaScript com componentes prontos. " +
        "Neste projeto escrevemos o CSS e os modais à mão; com o Bootstrap, " +
        "a maior parte disso viria pronta, bastando adicionar classes ao HTML.",
    topicos: [
        {
            titulo: "Sistema de grid e container",
            texto:
                "As classes container, row e col-* organizam o layout e se adaptam " +
                "sozinhas a celulares e telas grandes, no lugar do nosso .container e das media queries."
        },
        {
            titulo: "Formulários e botões prontos",
            texto:
                "form-control, form-label, btn btn-primary e btn btn-danger substituem " +
                "o estilo que escrevemos para inputs e botões, com hover e foco já incluídos."
        },
        {
            titulo: "Alertas no lugar da nossa mensagem de erro",
            texto:
                "A caixa vermelha de validação seria um componente alert alert-danger, " +
                "com variações de cor para sucesso, aviso e informação."
        },
        {
            titulo: "Modal nativo da biblioteca",
            texto:
                "O nosso modal de confirmação equivale ao componente Modal do Bootstrap, que já " +
                "cuida de fundo escuro, tecla Esc, foco e acessibilidade, usando data-bs-toggle e data-bs-target."
        },
        {
            titulo: "Tabelas estilizadas",
            texto:
                "Com table table-striped table-hover a listagem de produtos ganha " +
                "linhas zebradas e destaque ao passar o mouse sem CSS extra."
        }
    ],
    exemploTitulo: "Exemplo: nossa mensagem de erro em Bootstrap",
    exemploCodigo:
        '<div class="alert alert-danger" role="alert">\n' +
        "  Informe o nome do produto.\n" +
        "</div>",
    uso:
        "Para usar, basta incluir o link do CSS e o script do Bootstrap (via CDN) no index.html."
};

function montarModalBootstrap() {
    modalBootstrapTitulo.textContent = conteudoBootstrap.titulo;
    modalBootstrapCorpo.textContent = "";

    const intro = document.createElement("p");
    intro.textContent = conteudoBootstrap.intro;
    modalBootstrapCorpo.appendChild(intro);

    const lista = document.createElement("ul");
    lista.className = "lista-bootstrap";
    conteudoBootstrap.topicos.forEach((topico) => {
        const item = document.createElement("li");
        const titulo = document.createElement("strong");
        titulo.textContent = topico.titulo + ": ";
        item.append(titulo, document.createTextNode(topico.texto));
        lista.appendChild(item);
    });
    modalBootstrapCorpo.appendChild(lista);

    const tituloExemplo = document.createElement("p");
    const tituloExemploNegrito = document.createElement("strong");
    tituloExemploNegrito.textContent = conteudoBootstrap.exemploTitulo;
    tituloExemplo.appendChild(tituloExemploNegrito);
    modalBootstrapCorpo.appendChild(tituloExemplo);

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = conteudoBootstrap.exemploCodigo;
    pre.appendChild(code);
    modalBootstrapCorpo.appendChild(pre);

    const uso = document.createElement("p");
    uso.textContent = conteudoBootstrap.uso;
    modalBootstrapCorpo.appendChild(uso);
}

function fecharModalBootstrap() {
    modalBootstrapFechar.removeEventListener("click", fecharModalBootstrap);
    modalBootstrap.removeEventListener("click", aoClicarForaBootstrap);
    document.removeEventListener("keydown", aoTeclarBootstrap);
    fecharModal(modalBootstrap);
}

function aoClicarForaBootstrap(evento) {
    if (evento.target === modalBootstrap) fecharModalBootstrap();
}

function aoTeclarBootstrap(evento) {
    if (evento.key === "Escape") fecharModalBootstrap();
    prenderFoco(evento, [modalBootstrapFechar]);
}

btnBootstrap.addEventListener("click", function () {
    montarModalBootstrap();
    modalBootstrapFechar.addEventListener("click", fecharModalBootstrap);
    modalBootstrap.addEventListener("click", aoClicarForaBootstrap);
    document.addEventListener("keydown", aoTeclarBootstrap);
    abrirModal(modalBootstrap);
    modalBootstrapFechar.focus();
});

// ---------------------------------------------------------------
// Persistência com localStorage
// ---------------------------------------------------------------
function salvarNoLocalStorage() {
    try {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaDeProdutos));
    } catch (erro) {
        console.error("Erro ao salvar produtos:", erro);
        mostrarToast("Não foi possível salvar os produtos no navegador.", "erro");
    }
}

function carregarDoLocalStorage() {
    try {
        const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);
        if (!dadosSalvos) return;

        const produtosObjetos = JSON.parse(dadosSalvos);
        if (!Array.isArray(produtosObjetos)) return;

        produtosObjetos.forEach((prod) => {
            listaDeProdutos.push(new Produto(prod.nome, prod.preco, prod.quantidade));
        });
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        mostrarToast("Não foi possível carregar os produtos salvos.", "erro");
    }
}

// FASE 4: Gerenciamento do modo de edição
function prepararEdicao(produto) {
    const indexOriginal = listaDeProdutos.indexOf(produto);

    if (indexOriginal < 0) {
        mostrarToast("Produto não encontrado.", "erro");
        return;
    }

    limparErro();
    campoNome.value = produto.nome;
    campoPreco.value = produto.preco;
    campoQuantidade.value = produto.quantidade;

    indiceEdicao = indexOriginal;
    btnSalvar.textContent = "Salvar Alterações";
    btnCancelar.hidden = false;
    campoNome.focus();
}

function resetarFormulario() {
    formProduto.reset();
    limparErro();
    indiceEdicao = null;
    btnSalvar.textContent = "Adicionar Produto";
    btnCancelar.hidden = true;
}

// FASE 5: Validação e Submit
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();

    // Sanitização com trim().
    const nome = campoNome.value.trim();
    const precoTexto = campoPreco.value.trim();
    const quantidadeTexto = campoQuantidade.value.trim();
    const preco = Number(precoTexto);
    const quantidade = Number(quantidadeTexto);

    // Guard Clauses: cada erro aparece no formulário, junto ao campo.
    if (!nome) {
        mostrarErro("Informe o nome do produto.", campoNome);
        return;
    }

    if (precoTexto === "" || !Number.isFinite(preco) || preco <= 0) {
        mostrarErro("O preço deve ser um número maior que zero.", campoPreco);
        return;
    }

    if (
        quantidadeTexto === "" ||
        !Number.isFinite(quantidade) ||
        !Number.isInteger(quantidade) ||
        quantidade <= 0
    ) {
        mostrarErro("A quantidade deve ser um número inteiro maior que zero.", campoQuantidade);
        return;
    }

    limparErro();
    const novoProduto = new Produto(nome, preco, quantidade);

    // Inclusão (Create) ou atualização (Update).
    if (indiceEdicao === null) {
        listaDeProdutos.push(novoProduto);
        mostrarToast("Produto cadastrado com sucesso!");
    } else {
        listaDeProdutos[indiceEdicao] = novoProduto;
        mostrarToast("Produto atualizado com sucesso!");
    }

    salvarNoLocalStorage();
    resetarFormulario();
    atualizarInterface();
});

btnCancelar.addEventListener("click", function () {
    resetarFormulario();
});

// Limpar toda a tabela (com modal de confirmação).
btnLimparTudo.addEventListener("click", async function () {
    if (listaDeProdutos.length === 0) {
        mostrarToast("A tabela já está vazia.", "info");
        return;
    }

    const confirmado = await confirmarAcao({
        titulo: "Limpar todo o estoque",
        mensagem: `Isso vai remover os ${listaDeProdutos.length} produto(s) cadastrado(s). Essa ação não pode ser desfeita.`,
        textoConfirmar: "Remover tudo"
    });

    if (!confirmado) return;

    listaDeProdutos.length = 0;
    localStorage.removeItem(CHAVE_STORAGE);
    resetarFormulario();
    atualizarInterface();
    mostrarToast("Todos os produtos foram removidos.", "info");
});

// FASE 6: Atualização e renderização da interface
function obterProdutosFiltrados() {
    const termo = campoBusca.value.trim().toLowerCase();
    return listaDeProdutos.filter((produto) =>
        produto.nome.toLowerCase().includes(termo)
    );
}

async function removerProduto(produto) {
    if (listaDeProdutos.indexOf(produto) < 0) return;

    const confirmado = await confirmarAcao({
        titulo: "Remover produto",
        mensagem: `Deseja remover "${produto.nome}"? Essa ação não pode ser desfeita.`,
        textoConfirmar: "Remover"
    });

    if (!confirmado) return;

    // Recalcula o índice após a resposta, pois a lista pode ter mudado.
    const indexOriginal = listaDeProdutos.indexOf(produto);
    if (indexOriginal < 0) return;

    listaDeProdutos.splice(indexOriginal, 1);

    // Ajusta o modo de edição caso o item removido afete o índice em edição.
    if (indiceEdicao === indexOriginal) {
        resetarFormulario();
    } else if (indiceEdicao !== null && indiceEdicao > indexOriginal) {
        indiceEdicao -= 1;
    }

    salvarNoLocalStorage();
    atualizarInterface();
    mostrarToast("Produto removido.", "info");
}

function atualizarTotalEstoque() {
    const produtosVisiveis = obterProdutosFiltrados();
    const total = produtosVisiveis.reduce(
        (acc, produto) => acc + produto.calcularSubtotal(),
        0
    );

    totalEstoqueEl.textContent = `Total em Estoque: ${total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    })}`;
}

function renderizarTabela() {
    const tabelaBody = document.querySelector("#tabela-produtos tbody");
    tabelaBody.innerHTML = "";

    const produtosFiltrados = obterProdutosFiltrados();

    if (produtosFiltrados.length === 0) {
        const linhaVazia = document.createElement("tr");
        const celulaVazia = document.createElement("td");
        celulaVazia.colSpan = 5;
        celulaVazia.textContent = "Nenhum produto encontrado.";
        linhaVazia.appendChild(celulaVazia);
        tabelaBody.appendChild(linhaVazia);
        return;
    }

    produtosFiltrados.forEach((produto) => {
        const linha = document.createElement("tr");

        const celulaNome = document.createElement("td");
        celulaNome.textContent = produto.nome;

        const celulaPreco = document.createElement("td");
        celulaPreco.textContent = produto.preco.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        const celulaQuantidade = document.createElement("td");
        celulaQuantidade.textContent = String(produto.quantidade);

        const celulaSubtotal = document.createElement("td");
        celulaSubtotal.textContent = produto.calcularSubtotal().toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        const celulaAcoes = document.createElement("td");

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "btn-editar";
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", () => prepararEdicao(produto));

        const btnRemover = document.createElement("button");
        btnRemover.type = "button";
        btnRemover.className = "btn-remover";
        btnRemover.textContent = "Remover";
        btnRemover.addEventListener("click", () => removerProduto(produto));

        celulaAcoes.append(btnEditar, btnRemover);
        linha.append(
            celulaNome,
            celulaPreco,
            celulaQuantidade,
            celulaSubtotal,
            celulaAcoes
        );
        tabelaBody.appendChild(linha);
    });
}

function atualizarInterface() {
    renderizarTabela();
    atualizarTotalEstoque();
}

// Busca em tempo real
campoBusca.addEventListener("input", function () {
    atualizarInterface();
});

// FASE 7: Inicialização
carregarDoLocalStorage();
atualizarInterface();