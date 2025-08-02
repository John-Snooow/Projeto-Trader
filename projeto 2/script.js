// Estatísticas globais e diárias
let estatisticasGlobais = [];
let operacoesDiarias = [];
let operacoesPorDia = {};

// Carregar operações do localStorage ao iniciar
function carregarOperacoesSalvas() {
    const dados = localStorage.getItem('operacoesPorDia');
    if (dados) {
        operacoesPorDia = JSON.parse(dados);
        // Popular estatisticasGlobais e operacoesDiarias do dia atual
        estatisticasGlobais = [];
        operacoesDiarias = [];
        Object.keys(operacoesPorDia).forEach(dataStr => {
            operacoesPorDia[dataStr].forEach(op => {
                estatisticasGlobais.push({ ...op });
                // Se for do dia atual, adiciona em operacoesDiarias
                const hoje = new Date();
                const [d,m,y] = dataStr.split('/');
                if (parseInt(d) === hoje.getDate() && parseInt(m) === (hoje.getMonth()+1) && parseInt(y) === hoje.getFullYear()) {
                    operacoesDiarias.push(op.tipo);
                }
            });
        });
    }
}

// Salvar operações no localStorage
function salvarOperacoes() {
    localStorage.setItem('operacoesPorDia', JSON.stringify(operacoesPorDia));
}

function atualizarEstatisticas() {
    // Atualiza os valores globais
    const totalOps = estatisticasGlobais.length;
    const totalWins = estatisticasGlobais.filter(e => e.tipo === 'win').length;
    const totalLosses = estatisticasGlobais.filter(e => e.tipo === 'loss').length;
    const taxaAcerto = totalOps > 0 ? ((totalWins / totalOps) * 100).toFixed(1) : '0.0';

    // Atualiza os elementos visuais
    const totalOpsEl = document.getElementById('total-operations');
    const totalWinsEl = document.getElementById('total-wins');
    const totalLossesEl = document.getElementById('total-losses');
    const winRateEl = document.getElementById('win-rate');
    if (totalOpsEl) totalOpsEl.textContent = totalOps;
    if (totalWinsEl) totalWinsEl.textContent = totalWins;
    if (totalLossesEl) totalLossesEl.textContent = totalLosses;
    if (winRateEl) winRateEl.textContent = taxaAcerto + '%';

    // Lista detalhada das operações
    const statsEl = document.getElementById('global-stats-list');
    if (statsEl) {
        statsEl.innerHTML = '';
        estatisticasGlobais.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.tipo.toUpperCase()} | Valor: R$ ${item.valor.toFixed(2)} | ${item.data} ${item.hora}`;
            li.style.color = item.tipo === 'win' ? '#10b981' : '#ef4444';
            statsEl.appendChild(li);
        });
    }
}

function atualizarOperacoesDiarias() {
    const dailyWinsEl = document.getElementById('daily-wins');
    const dailyLossesEl = document.getElementById('daily-losses');
    if (dailyWinsEl) dailyWinsEl.textContent = operacoesDiarias.filter(op => op === 'win').length;
    if (dailyLossesEl) dailyLossesEl.textContent = operacoesDiarias.filter(op => op === 'loss').length;
}

function registrarOperacao(tipo, valor) {
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const hora = agora.toLocaleTimeString('pt-BR');
    const op = { tipo, valor, data, hora };
    estatisticasGlobais.push(op);
    operacoesDiarias.push(tipo);

    // Salva operação no objeto agrupado por dia
    if (!operacoesPorDia[data]) operacoesPorDia[data] = [];
    operacoesPorDia[data].push(op);
    salvarOperacoes();

    // Atualiza o valor da banca
    const bankInput = document.getElementById('bank-value');
    let bancaAtual = parseFloat(bankInput.value);
    if (tipo === 'win') {
        bancaAtual += valor;
    } else if (tipo === 'loss') {
        bancaAtual -= valor;
    }
    bankInput.value = bancaAtual.toFixed(2);
    if (document.getElementById('balance-value')) {
        document.getElementById('balance-value').textContent = bancaAtual.toFixed(2);
    }

    atualizarEstatisticas();
    atualizarOperacoesDiarias();
}

// Função para calcular e exibir as entradas
function calcularEntradas() {
    // Obter valores dos inputs
    const bankValue = parseFloat(document.getElementById('bank-value').value);
    const payout = parseFloat(document.getElementById('payout').value) / 100;
    const desiredReturn = parseFloat(document.getElementById('desired-return').value);
    const returnType = document.getElementById('return-type').value;
    const martingales = parseInt(document.getElementById('martingales').value);
    const operationType = document.getElementById('operation-type').value;

    // Validação simples
    if (!bankValue || !payout || !desiredReturn || !martingales) {
        alert('Preencha todos os campos corretamente.');
        return;
    }

    // Multiplicador conforme tipo de operação
    let multiplier = 2.5;
    if (operationType === 'conservative') multiplier = 2.25;
    if (operationType === 'aggressive') multiplier = 3.0;

    // Calcular retorno desejado
    const retornoDesejado = returnType === 'percent' ? bankValue * (desiredReturn / 100) : desiredReturn;
    const primeiraEntrada = retornoDesejado / payout;

    // Gerar entradas
    let entradas = [];
    for (let i = 0; i < martingales; i++) {
        const valorEntrada = i === 0 ? primeiraEntrada : entradas[i-1].valor * multiplier;
        const retornoEsperado = valorEntrada * payout;
        const percBanca = (valorEntrada / bankValue) * 100;
        entradas.push({
            numero: i + 1,
            valor: valorEntrada,
            retorno: retornoEsperado,
            percBanca: percBanca
        });
    }

    // Exibir resultados na tabela
    const tabela = document.getElementById('results-table');
    tabela.innerHTML = '';
    entradas.forEach(entrada => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class='p-3'>${entrada.numero}</td>
            <td class='p-3'>R$ ${entrada.valor.toFixed(2)}</td>
            <td class='p-3'>R$ ${entrada.retorno.toFixed(2)}</td>
            <td class='p-3'>${entrada.percBanca.toFixed(2)}%</td>
            <td class='p-3'>
                <div style='display:flex;gap:4px;justify-content:center;'>
                    <button class='win-btn' style='
                        background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
                        color: white;
                        border: none;
                        padding: 2px 8px;
                        border-radius: 999px;
                        font-weight: 500;
                        font-size: 0.85rem;
                        cursor: pointer;
                        box-shadow: 0 1px 2px rgba(34,197,94,0.10);
                        transition: transform 0.1s, box-shadow 0.1s;
                        min-width: 48px;
                    '>✔ WIN</button>
                    <button class='loss-btn' style='
                        background: linear-gradient(90deg, #ef4444 0%, #b91c1c 100%);
                        color: white;
                        border: none;
                        padding: 2px 8px;
                        border-radius: 999px;
                        font-weight: 500;
                        font-size: 0.85rem;
                        cursor: pointer;
                        box-shadow: 0 1px 2px rgba(239,68,68,0.10);
                        transition: transform 0.1s, box-shadow 0.1s;
                        min-width: 48px;
                    '>✖ LOSS</button>
                </div>
            </td>
        `;
        tabela.appendChild(row);
        // Adiciona eventos aos botões
        row.querySelector('.win-btn').onclick = function() { registrarOperacao('win', entrada.valor); };
        row.querySelector('.loss-btn').onclick = function() { registrarOperacao('loss', entrada.valor); };
    });

    // Mostrar seção de resultados
    document.getElementById('results-section').classList.remove('hidden');
    if (document.getElementById('balance-value')) {
        document.getElementById('balance-value').textContent = bankValue.toFixed(2);
    }
}

window.addEventListener('DOMContentLoaded', function() {
    // Função para atualizar o gráfico do dashboard conforme filtro
    function atualizarDashboardGrafico() {
        const ctx = document.getElementById('history-chart').getContext('2d');
        const periodo = document.getElementById('time-period').value;
        const tipoGrafico = document.getElementById('chart-type').value;
        let anoSelecionado, mesSelecionado;
        // Pega mês/ano do dashboard
        if (periodo === 'month') {
            const currentMonthLabel = document.getElementById('current-month');
            if (currentMonthLabel) {
                const partes = currentMonthLabel.textContent.split(' ');
                const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
                mesSelecionado = nomesMes.indexOf(partes[0]);
                anoSelecionado = parseInt(partes[1]);
            } else {
                const hoje = new Date();
                mesSelecionado = hoje.getMonth();
                anoSelecionado = hoje.getFullYear();
            }
        } else {
            const hoje = new Date();
            mesSelecionado = hoje.getMonth();
            anoSelecionado = hoje.getFullYear();
        }

        let labels = [];
        let dataWins = [];
        let dataLosses = [];
        let tooltips = [];

        if (periodo === 'month') {
            // Mostra todos os dias do mês selecionado
            const diasNoMes = new Date(anoSelecionado, mesSelecionado + 1, 0).getDate();
            for (let dia = 1; dia <= diasNoMes; dia++) {
                labels.push(dia.toString());
                const opsDia = estatisticasGlobais.filter(e => {
                    const [d,m,y] = e.data.split('/');
                    return parseInt(d) === dia && parseInt(m) === (mesSelecionado+1) && parseInt(y) === anoSelecionado;
                });
                dataWins.push(opsDia.filter(e => e.tipo === 'win').length);
                dataLosses.push(opsDia.filter(e => e.tipo === 'loss').length);
                // Tooltip detalhado por dia
                let detalhes = opsDia.map(e => `${e.tipo.toUpperCase()} | R$ ${e.valor.toFixed(2)} | ${e.hora}`).join('\n');
                tooltips.push(detalhes || 'Nenhuma operação');
            }
        } else if (periodo === 'year') {
            // Mostra todos os meses do ano selecionado
            labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            for (let m = 1; m <= 12; m++) {
                const opsMes = estatisticasGlobais.filter(e => {
                    const [d,m_,y] = e.data.split('/');
                    return parseInt(m_) === m && parseInt(y) === anoSelecionado;
                });
                dataWins.push(opsMes.filter(e => e.tipo === 'win').length);
                dataLosses.push(opsMes.filter(e => e.tipo === 'loss').length);
                // Tooltip detalhado por mês
                let detalhes = opsMes.map(e => `${e.tipo.toUpperCase()} | Dia ${e.data} | R$ ${e.valor.toFixed(2)} | ${e.hora}`).join('\n');
                tooltips.push(detalhes || 'Nenhuma operação');
            }
        } else {
            // Dia: mostra operações do dia atual
            const hoje = new Date();
            labels = ['Wins', 'Losses'];
            const opsDia = estatisticasGlobais.filter(e => {
                const [d,m,y] = e.data.split('/');
                return parseInt(d) === hoje.getDate() && parseInt(m) === (hoje.getMonth()+1) && parseInt(y) === hoje.getFullYear();
            });
            dataWins = [opsDia.filter(e => e.tipo === 'win').length];
            dataLosses = [opsDia.filter(e => e.tipo === 'loss').length];
            let detalhes = opsDia.map(e => `${e.tipo.toUpperCase()} | R$ ${e.valor.toFixed(2)} | ${e.hora}`).join('\n');
            tooltips = [detalhes || 'Nenhuma operação'];
        }

        // Remove gráfico anterior se existir
        if (window.dashboardChart) {
            window.dashboardChart.destroy();
        }

        // Cria novo gráfico
        window.dashboardChart = new Chart(ctx, {
            type: tipoGrafico,
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Wins',
                        data: dataWins,
                        backgroundColor: 'rgba(16,185,129,0.7)',
                        borderColor: 'rgba(16,185,129,1)',
                        borderWidth: 2,
                        datalabels: {
                            color: '#fff',
                            anchor: 'end',
                            align: 'top',
                            font: { weight: 'bold' }
                        }
                    },
                    {
                        label: 'Losses',
                        data: dataLosses,
                        backgroundColor: 'rgba(239,68,68,0.7)',
                        borderColor: 'rgba(239,68,68,1)',
                        borderWidth: 2,
                        datalabels: {
                            color: '#fff',
                            anchor: 'end',
                            align: 'top',
                            font: { weight: 'bold' }
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const idx = context.dataIndex;
                                return tooltips[idx];
                            }
                        }
                    }
                }
            }
        });
    }

    // Atualiza o gráfico ao carregar e ao mudar filtros
    if (document.getElementById('history-chart')) {
        atualizarDashboardGrafico();
        document.getElementById('time-period').addEventListener('change', atualizarDashboardGrafico);
        document.getElementById('chart-type').addEventListener('change', atualizarDashboardGrafico);
    }
    document.getElementById('calculate-btn').addEventListener('click', calcularEntradas);
    carregarOperacoesSalvas();
    atualizarEstatisticas();
    atualizarOperacoesDiarias();
    // Adiciona lista para estatísticas globais dentro de operações do dia
    if (!document.getElementById('global-stats-list')) {
        const statsDiv = document.createElement('div');
        statsDiv.className = 'mt-6';
        statsDiv.innerHTML = `<h3 class='text-lg font-bold mb-2'>Histórico de Operações</h3><ul id='global-stats-list' style='list-style:none;padding:0;'></ul>`;
        const operacoesDia = document.getElementById('operations-list');
        if (operacoesDia) operacoesDia.parentNode.insertBefore(statsDiv, operacoesDia);
    }
    // Adiciona calendário dentro do tópico de calendário estilizado
    if (!document.getElementById('simple-calendar')) {
        const calendarDiv = document.createElement('div');
        calendarDiv.id = 'simple-calendar';
        calendarDiv.className = 'mt-4';
        calendarDiv.innerHTML = `<div id='calendar-days-grid' style='display:grid;grid-template-columns:repeat(7,1fr);gap:4px;'></div>`;
        // Procura pelo card do calendário
        const cards = document.querySelectorAll('.card');
        let calendarioCard = null;
        cards.forEach(card => {
            if (card.querySelector('h2') && card.querySelector('h2').textContent.includes('Calendário')) {
                calendarioCard = card;
            }
        });
        if (calendarioCard) {
            calendarioCard.appendChild(calendarDiv);
            gerarCalendario();
        }
    }
    // Evento para botão Hoje no tópico de ações
    const btnHoje = document.getElementById('back-to-today');
    if (btnHoje) {
        btnHoje.addEventListener('click', function() {
            const hoje = new Date();
            // Mostra operações do dia atual no painel de estatísticas globais
            const lista = document.getElementById('global-stats-list');
            if (lista) {
                // Filtra operações do dia atual
                const opsDia = estatisticasGlobais.filter(e => {
                    const [d,m,y] = e.data.split('/');
                    return parseInt(d) === hoje.getDate() && parseInt(m) === (hoje.getMonth()+1) && parseInt(y) === hoje.getFullYear();
                });
                lista.innerHTML = '';
                if (opsDia.length === 0) {
                    lista.innerHTML = '<li>Nenhuma operação registrada hoje.</li>';
                } else {
                    opsDia.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = `${item.tipo.toUpperCase()} | Valor: R$ ${item.valor.toFixed(2)} | ${item.data} ${item.hora}`;
                        li.style.color = item.tipo === 'win' ? '#10b981' : '#ef4444';
                        lista.appendChild(li);
                    });
                }
            }
        });
    }

    // Evento para botão Apagar no tópico de ações
    const btnApagar = document.getElementById('delete-history');
    if (btnApagar) {
        btnApagar.addEventListener('click', function() {
            const hoje = new Date();
            const dataHoje = hoje.toLocaleDateString('pt-BR');
            // Remove do objeto de operações por dia
            if (operacoesPorDia[dataHoje]) {
                delete operacoesPorDia[dataHoje];
                salvarOperacoes();
            }
            // Atualiza variáveis globais e exibição instantaneamente
            estatisticasGlobais = [];
            operacoesDiarias = [];
            Object.keys(operacoesPorDia).forEach(dataStr => {
                operacoesPorDia[dataStr].forEach(op => {
                    estatisticasGlobais.push({ ...op });
                    // Se for do dia atual, adiciona em operacoesDiarias
                    const hojeObj = new Date();
                    const [d,m,y] = dataStr.split('/');
                    if (parseInt(d) === hojeObj.getDate() && parseInt(m) === (hojeObj.getMonth()+1) && parseInt(y) === hojeObj.getFullYear()) {
                        operacoesDiarias.push(op.tipo);
                    }
                });
            });
            atualizarEstatisticas();
            atualizarOperacoesDiarias();
            mostrarOperacoesDoDiaSelecionado(hoje.getDate(), hoje.getMonth()+1, hoje.getFullYear());
        });
    }
});

// Variáveis para navegação do calendário
let calendarioMes = (new Date()).getMonth();
let calendarioAno = (new Date()).getFullYear();

function gerarCalendario() {
    const grid = document.getElementById('calendar-days-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const hoje = new Date();
    const ano = calendarioAno;
    const mes = calendarioMes;
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    // Adiciona cabeçalho dos dias da semana
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    diasSemana.forEach(dia => {
        const th = document.createElement('div');
        th.textContent = dia;
        th.style.fontWeight = 'bold';
        th.style.textAlign = 'center';
        th.style.background = '#e2e8f0';
        th.style.padding = '6px';
        grid.appendChild(th);
    });
    // Descobre o dia da semana do primeiro dia do mês
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    // Adiciona células vazias antes do primeiro dia
    for (let i = 0; i < primeiroDiaSemana; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.textContent = '';
        grid.appendChild(emptyCell);
    }
    // Adiciona os dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const cell = document.createElement('div');
        cell.textContent = dia;
        cell.style.padding = '8px';
        cell.style.borderRadius = '6px';
        cell.style.textAlign = 'center';
        cell.style.background = '#fff';
        cell.style.color = '#1e293b';
        cell.style.cursor = 'pointer';
        // Marca o dia de verde se houver exatamente 1 ou 2 operações de LOSS
        const opsDia = estatisticasGlobais.filter(e => {
            const [d,m,y] = e.data.split('/');
            return parseInt(d) === dia && parseInt(m) === (mes+1) && parseInt(y) === ano;
        });
        const lossesDia = opsDia.filter(e => e.tipo === 'loss').length;
        const winsDia = opsDia.filter(e => e.tipo === 'win').length;
        if (opsDia.length > 0 && winsDia === 0 && (lossesDia === 1 || lossesDia === 2)) {
            cell.style.background = 'rgba(239,68,68,0.5)'; // vermelho
            cell.style.color = '#fff';
            cell.style.fontWeight = 'bold';
        }
        // Marca hoje
        if (dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()) {
            cell.style.border = '2px solid #3b82f6';
        }
        // Adiciona evento de clique para mostrar operações do dia (sempre mostra, mesmo sem histórico)
        cell.onclick = function() {
            mostrarOperacoesDoDiaSelecionado(dia, mes+1, ano);
            // Exibe estatísticas globais dentro do tópico de operações do dia
            const statsDiv = document.querySelector('.mt-6');
            const operacoesDia = document.getElementById('operations-list');
            if (statsDiv && operacoesDia) {
                operacoesDia.parentNode.insertBefore(statsDiv, operacoesDia);
                statsDiv.style.display = 'block';
            }
        };
        grid.appendChild(cell);
    }
// Função para exibir operações do dia selecionado no tópico de operações diárias
function mostrarOperacoesDoDiaSelecionado(dia, mes, ano) {
    const lista = document.getElementById('operations-list');
    if (!lista) return;
    // Filtra operações do dia
    const opsDia = estatisticasGlobais.filter(e => {
        const [d,m_,y] = e.data.split('/');
        return parseInt(d) === dia && parseInt(m_) === mes && parseInt(y) === ano;
    });
    lista.innerHTML = '';
    if (opsDia.length === 0) {
        lista.innerHTML = '<li>Nenhuma operação registrada neste dia.</li>';
        return;
    }
    opsDia.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.tipo.toUpperCase()} | Valor: R$ ${item.valor.toFixed(2)} | ${item.data} ${item.hora}`;
        li.style.color = item.tipo === 'win' ? '#10b981' : '#ef4444';
        lista.appendChild(li);
    });
}
    // Adiciona navegação
    adicionarNavegacaoCalendario();
}

function adicionarNavegacaoCalendario() {
    let navDiv = document.getElementById('calendar-nav');
    if (!navDiv) {
        navDiv = document.createElement('div');
        navDiv.id = 'calendar-nav';
        navDiv.style.display = 'flex';
        navDiv.style.justifyContent = 'space-between';
        navDiv.style.alignItems = 'center';
        navDiv.style.marginBottom = '8px';
        const grid = document.getElementById('calendar-days-grid');
        if (grid && grid.parentNode) grid.parentNode.insertBefore(navDiv, grid);
    }
    navDiv.innerHTML = '';
    const btnPrev = document.createElement('button');
    btnPrev.textContent = '<';
    btnPrev.style.background = '#e2e8f0';
    btnPrev.style.border = 'none';
    btnPrev.style.padding = '4px 12px';
    btnPrev.style.borderRadius = '6px';
    btnPrev.style.cursor = 'pointer';
    btnPrev.onclick = function() {
        calendarioMes--;
        if (calendarioMes < 0) {
            calendarioMes = 11;
            calendarioAno--;
        }
        gerarCalendario();
    };
    const btnNext = document.createElement('button');
    btnNext.textContent = '>';
    btnNext.style.background = '#e2e8f0';
    btnNext.style.border = 'none';
    btnNext.style.padding = '4px 12px';
    btnNext.style.borderRadius = '6px';
    btnNext.style.cursor = 'pointer';
    btnNext.onclick = function() {
        calendarioMes++;
        if (calendarioMes > 11) {
            calendarioMes = 0;
            calendarioAno++;
        }
        gerarCalendario();
    };
    const mesAnoLabel = document.createElement('span');
    const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    mesAnoLabel.textContent = `${nomesMes[calendarioMes]} ${calendarioAno}`;
    mesAnoLabel.style.fontWeight = 'bold';
    navDiv.appendChild(btnPrev);
    navDiv.appendChild(mesAnoLabel);
    navDiv.appendChild(btnNext);
}