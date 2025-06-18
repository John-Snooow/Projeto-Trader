document.addEventListener('DOMContentLoaded', () => {
    function carregarDadosSalvos() {
        const dadosSalvos = JSON.parse(localStorage.getItem('projetoTraderConfig')) || {};
        
        if (dadosSalvos.banca) banca.value = dadosSalvos.banca;
        if (dadosSalvos.payout) payout.value = dadosSalvos.payout;
        if (dadosSalvos.retorno) retorno.value = dadosSalvos.retorno;
        if (dadosSalvos.retornoFixo) retornoFixo.value = dadosSalvos.retornoFixo;
        if (dadosSalvos.tipoOperacao) tipoOperacao.value = dadosSalvos.tipoOperacao;
        if (dadosSalvos.numMartingales) numMartingales.value = dadosSalvos.numMartingales;

        // Carregar resultados da tabela
        if (dadosSalvos.resultadosTabela) {
            atualizarTabela();
            dadosSalvos.resultadosTabela.forEach(resultado => {
                const checkbox = document.getElementById(`${resultado.tipo}_${resultado.numero}`);
                if (checkbox) {
                    checkbox.checked = true;
                    const row = checkbox.closest('tr');
                    row.classList.remove('win', 'loss');
                    row.classList.add(resultado.tipo);
                }
            });
            atualizarBanca();
        }
    }

    function salvarDados() {
        const resultadosTabela = [];
        document.querySelectorAll('.resultado-checkbox:checked').forEach(checkbox => {
            resultadosTabela.push({
                numero: parseInt(checkbox.id.split('_')[1]),
                tipo: checkbox.dataset.tipo,
                valor: checkbox.dataset.valor
            });
        });

        const dadosConfig = {
            banca: banca.value,
            payout: payout.value,
            retorno: retorno.value,
            retornoFixo: retornoFixo.value,
            tipoOperacao: tipoOperacao.value,
            numMartingales: numMartingales.value,
            resultadosTabela
        };
        localStorage.setItem('projetoTraderConfig', JSON.stringify(dadosConfig));
    }

    const banca = document.getElementById('banca');
    const payout = document.getElementById('payout');
    const retorno = document.getElementById('retorno');
    const retornoFixo = document.getElementById('retornoFixo');
    const tipoOperacao = document.getElementById('tipoOperacao');
    const numMartingales = document.getElementById('numMartingales');
    const martingaleBtn = document.getElementById('martingaleBtn');
    const calculoTable = document.getElementById('calculoTable').getElementsByTagName('tbody')[0];

    function calcularMartingale() {
        const bancaAtual = parseFloat(banca.value);
        const payoutPct = parseFloat(payout.value) / 100;
        const retornoPct = parseFloat(retorno.value) / 100;
        const retornoValor = parseFloat(retornoFixo.value);
        const tipo = tipoOperacao.value;
        const numLinhas = parseInt(numMartingales.value);

        let fatorMultiplicacao;
        switch(tipo) {
            case 'conservador':
                fatorMultiplicacao = 2.25;
                break;
            case 'moderado':
                fatorMultiplicacao = 2.5;
                break;
            case 'agressivo':
                fatorMultiplicacao = 3;
                break;
            default:
                fatorMultiplicacao = 2.25;
        }

        let valorEntrada;
        if (retornoPct > 0) {
            valorEntrada = (bancaAtual * retornoPct) / payoutPct;
        } else {
            valorEntrada = retornoValor / payoutPct;
        }
        
        let resultados = [];
        for(let i = 1; i <= numLinhas; i++) {
            const retornoEsperado = valorEntrada * payoutPct;
            const percentualBanca = (valorEntrada / bancaAtual * 100).toFixed(2);
            resultados.push({
                n: i,
                valor: valorEntrada.toFixed(2),
                retorno: retornoEsperado.toFixed(2),
                percentual: percentualBanca
            });
            valorEntrada *= fatorMultiplicacao;
        }

        return resultados;
    }

    function atualizarTabela() {
        const resultados = calcularMartingale();
        calculoTable.innerHTML = '';

        let perdas = 0;
        resultados.forEach(resultado => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${resultado.n}</td>
                <td>R$ ${parseFloat(resultado.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>R$ ${parseFloat(resultado.retorno).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>${resultado.percentual}%</td>
                <td>
                    <div class="checkbox-container">
                        <input type="checkbox" id="win_${resultado.n}" class="resultado-checkbox" data-valor="${resultado.retorno}" data-tipo="win">
                        <label for="win_${resultado.n}" class="checkbox-label">Ganho</label>
                        <input type="checkbox" id="loss_${resultado.n}" class="resultado-checkbox" data-valor="-${resultado.valor}" data-tipo="loss">
                        <label for="loss_${resultado.n}" class="checkbox-label">Perda</label>
                    </div>
                </td>
            `;
            
            if (perdas < 2) {
                row.classList.add('loss');
                perdas++;
            } else if (perdas === 2) {
                row.classList.add('win');
                perdas++;
            }
            
            calculoTable.appendChild(row);
        });
    }

    function atualizarBanca() {
        const bancaInicial = parseFloat(banca.value);
        let saldoAtual = bancaInicial;
        
        document.querySelectorAll('.resultado-checkbox:checked').forEach(checkbox => {
            saldoAtual += parseFloat(checkbox.dataset.valor);
        });

        // Atualiza o campo de banca com o saldo atual
        banca.value = saldoAtual.toFixed(2);
        salvarDados(); // Salva o novo valor da banca no localStorage

        const bancaAtualElement = document.getElementById('bancaAtual');
        bancaAtualElement.textContent = `Saldo Atual: R$ ${saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Atualiza as classes de cor com base no saldo
        bancaAtualElement.classList.remove('positivo', 'negativo');
        if (saldoAtual > bancaInicial) {
            bancaAtualElement.classList.add('positivo');
        } else if (saldoAtual < bancaInicial) {
            bancaAtualElement.classList.add('negativo');
        }
    }

    function handleCheckboxChange(e) {
        const checkbox = e.target;
        const tipo = checkbox.dataset.tipo;
        const row = checkbox.closest('tr');
        
        // Desmarca o outro checkbox da mesma linha
        const outroTipo = tipo === 'win' ? 'loss' : 'win';
        const outroCheckbox = row.querySelector(`[data-tipo="${outroTipo}"]`);
        if (outroCheckbox) outroCheckbox.checked = false;
        
        // Atualiza as classes da linha
        row.classList.remove('win', 'loss');
        if (checkbox.checked) {
            row.classList.add(tipo);
        }
        const numero = checkbox.id.split('_')[1];

        if (checkbox.checked) {
            // Desmarcar o checkbox oposto
            const outroTipo = tipo === 'win' ? 'loss' : 'win';
            document.getElementById(`${outroTipo}_${numero}`).checked = false;
        }

        atualizarBanca();
    }

    // Event Listeners
    carregarDadosSalvos();

    [banca, payout, retorno, retornoFixo, tipoOperacao, numMartingales].forEach(input => {
        input.addEventListener('input', () => {
            salvarDados();
        });
    });

    calculoTable.addEventListener('change', e => {
        if (e.target.classList.contains('resultado-checkbox')) {
            handleCheckboxChange(e);
            salvarDados();
        }
    });

    martingaleBtn.addEventListener('click', () => {
        martingaleBtn.classList.add('active');
        atualizarTabela();
        atualizarBanca();
    });

    // Inicializar tabela
    atualizarTabela();
});