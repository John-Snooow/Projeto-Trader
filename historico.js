document.addEventListener('DOMContentLoaded', () => {
    const winButton = document.getElementById('winButton');
    const lossButton = document.getElementById('lossButton');
    const voltarButton = document.getElementById('voltarButton');
    const apagarButton = document.getElementById('apagarButton');
    const totalWinElement = document.getElementById('totalWin');
    const totalLossElement = document.getElementById('totalLoss');
    const winRateElement = document.getElementById('winRate');
    const historicoLista = document.getElementById('historicoLista');

    let historico = JSON.parse(localStorage.getItem('historico')) || [];
    let totalWin = parseInt(localStorage.getItem('totalWin')) || 0;
    let totalLoss = parseInt(localStorage.getItem('totalLoss')) || 0;

    function atualizarEstatisticas() {
        totalWinElement.textContent = totalWin;
        totalLossElement.textContent = totalLoss;
        const total = totalWin + totalLoss;
        const winRate = total > 0 ? ((totalWin / total) * 100).toFixed(1) : '0';
        winRateElement.textContent = `${winRate}%`;
    }

    function atualizarEstatisticasDia() {
        const totalWinDiaElement = document.getElementById('totalWinDia');
        const totalLossDiaElement = document.getElementById('totalLossDia');
        const winRateDiaElement = document.getElementById('winRateDia');
        if (!filtroData) {
            totalWinDiaElement.textContent = '0';
            totalLossDiaElement.textContent = '0';
            winRateDiaElement.textContent = '0%';
            return;
        }
        let winDia = 0;
        let lossDia = 0;
        historico.forEach(operacao => {
            const dataOperacao = formatarDataParaInput(operacao.data);
            if (dataOperacao === filtroData) {
                if (operacao.tipo === 'win') winDia++;
                else if (operacao.tipo === 'loss') lossDia++;
            }
        });
        const totalDia = winDia + lossDia;
        const winRateDia = totalDia > 0 ? ((winDia / totalDia) * 100).toFixed(1) : '0';
        totalWinDiaElement.textContent = winDia;
        totalLossDiaElement.textContent = lossDia;
        winRateDiaElement.textContent = `${winRateDia}%`;
    }

    function adicionarOperacao(tipo) {
        const operacao = {
            tipo,
            data: new Date().toLocaleString('pt-BR')
        };
        historico.unshift(operacao);
        localStorage.setItem('historico', JSON.stringify(historico));

        if (tipo === 'win') {
            totalWin++;
            localStorage.setItem('totalWin', totalWin);
        } else {
            totalLoss++;
            localStorage.setItem('totalLoss', totalLoss);
        }

        atualizarEstatisticas();
        atualizarHistoricoLista();
        renderCustomCalendar(calendarMonth, calendarYear);
    }

    function desfazerUltimaOperacao() {
        if (historico.length > 0) {
            const ultimaOperacao = historico[0];
            historico.shift();
            localStorage.setItem('historico', JSON.stringify(historico));

            if (ultimaOperacao.tipo === 'win') {
                totalWin--;
                localStorage.setItem('totalWin', totalWin);
            } else {
                totalLoss--;
                localStorage.setItem('totalLoss', totalLoss);
            }

            atualizarEstatisticas();
            atualizarHistoricoLista();
        }
    }

    function apagarHistorico() {
        if (!filtroData) return;

        let winsRemovidos = 0;
        let lossesRemovidos = 0;
        
        const novoHistorico = [];

        for (const operacao of historico) {
            const dataOperacao = formatarDataParaInput(operacao.data);
            if (dataOperacao === filtroData) {
                if (operacao.tipo === 'win') {
                    winsRemovidos++;
                } else {
                    lossesRemovidos++;
                }
            } else {
                novoHistorico.push(operacao);
            }
        }

        historico = novoHistorico;
        totalWin -= winsRemovidos;
        totalLoss -= lossesRemovidos;

        localStorage.setItem('historico', JSON.stringify(historico));
        localStorage.setItem('totalWin', totalWin);
        localStorage.setItem('totalLoss', totalLoss);

        atualizarEstatisticas();
        atualizarHistoricoLista();
    }

    // CALENDÁRIO CUSTOMIZADO
    const customCalendar = document.getElementById('customCalendar');
    let filtroData = null;
    let calendarMonth = new Date().getMonth();
    let calendarYear = new Date().getFullYear();

    function renderCustomCalendar(month, year) {
        if (!customCalendar) return;
        customCalendar.innerHTML = '';
        const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        const header = document.createElement('div');
        header.className = 'custom-calendar-header';
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '&#8592;';
        prevBtn.onclick = () => {
            if (month === 0) {
                calendarMonth = 11;
                calendarYear--;
            } else {
                calendarMonth--;
            }
            renderCustomCalendar(calendarMonth, calendarYear);
        };
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '&#8594;';
        nextBtn.onclick = () => {
            if (month === 11) {
                calendarMonth = 0;
                calendarYear++;
            } else {
                calendarMonth++;
            }
            renderCustomCalendar(calendarMonth, calendarYear);
        };
        const title = document.createElement('span');
        title.className = 'custom-calendar-title';
        title.textContent = `${('0'+(month+1)).slice(-2)}/${year}`;
        header.appendChild(prevBtn);
        header.appendChild(title);
        header.appendChild(nextBtn);
        customCalendar.appendChild(header);

        const daysRow = document.createElement('div');
        daysRow.className = 'custom-calendar-days';
        diasSemana.forEach(dia => {
            const dayName = document.createElement('div');
            dayName.className = 'custom-calendar-day-name';
            dayName.textContent = dia;
            daysRow.appendChild(dayName);
        });
        customCalendar.appendChild(daysRow);

        const datesGrid = document.createElement('div');
        datesGrid.className = 'custom-calendar-dates';
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'custom-calendar-date disabled';
            datesGrid.appendChild(empty);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateBtn = document.createElement('button');
            dateBtn.className = 'custom-calendar-date';
            dateBtn.textContent = d;
            const dataStr = `${year}-${('0' + (month + 1)).slice(-2)}-${('0' + d).slice(-2)}`;
            dateBtn.dataset.date = dataStr;

            const operacoesDoDia = historico.filter(op => formatarDataParaInput(op.data) === dataStr);
            if (operacoesDoDia.length > 0) {
                let lossConsecutivos = 0;
                let maxLossConsecutivos = 0;
                for (const op of operacoesDoDia) {
                    if (op.tipo === 'loss') {
                        lossConsecutivos++;
                    } else {
                        maxLossConsecutivos = Math.max(maxLossConsecutivos, lossConsecutivos);
                        lossConsecutivos = 0;
                    }
                }
                maxLossConsecutivos = Math.max(maxLossConsecutivos, lossConsecutivos);

                if (maxLossConsecutivos >= 2) {
                    dateBtn.classList.add('day-has-loss');
                } else {
                    dateBtn.classList.add('day-has-win');
                }
            }

            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dateBtn.classList.add('today');
            }
            if (filtroData === dataStr) {
                dateBtn.classList.add('selected');
            }

            dateBtn.onclick = () => {
                filtroData = dataStr;
                renderCustomCalendar(calendarMonth, calendarYear);
                atualizarHistoricoLista();
                atualizarEstatisticasDia();
            };
            datesGrid.appendChild(dateBtn);
        }

        const totalCells = firstDay + daysInMonth;
        for (let i = totalCells; i % 7 !== 0; i++) {
            const empty = document.createElement('div');
            empty.className = 'custom-calendar-date disabled';
            datesGrid.appendChild(empty);
        }
        customCalendar.appendChild(datesGrid);
    }

    function formatarDataParaInput(dateString) {
        // dateString no formato 'dd/mm/yyyy, hh:mm:ss'
        const [data] = dateString.split(',');
        const [dia, mes, ano] = data.split('/');
        return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    function atualizarHistoricoLista() {
        historicoLista.innerHTML = '';
        historico.forEach(operacao => {
            const dataOperacao = formatarDataParaInput(operacao.data);
            if (!filtroData || filtroData === dataOperacao) {
                const item = document.createElement('div');
                item.className = `historico-item ${operacao.tipo}`;
                item.innerHTML = `
                    <span>${operacao.tipo.toUpperCase()}</span>
                    <span>${operacao.data}</span>
                `;
                historicoLista.appendChild(item);
            }
        });
        atualizarEstatisticasDia();
    }

    winButton.addEventListener('click', () => adicionarOperacao('win'));
    lossButton.addEventListener('click', () => adicionarOperacao('loss'));
    voltarButton.addEventListener('click', desfazerUltimaOperacao);
    apagarButton.addEventListener('click', apagarHistorico);

    // Inicialização do calendário customizado
    renderCustomCalendar(calendarMonth, calendarYear);

    atualizarEstatisticas();
    atualizarEstatisticasDia();
    atualizarHistoricoLista();
});