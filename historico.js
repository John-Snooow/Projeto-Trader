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
        historico = [];
        totalWin = 0;
        totalLoss = 0;
        localStorage.removeItem('historico');
        localStorage.removeItem('totalWin');
        localStorage.removeItem('totalLoss');
        atualizarEstatisticas();
        atualizarHistoricoLista();
    }

    function atualizarHistoricoLista() {
        historicoLista.innerHTML = '';
        historico.forEach(operacao => {
            const item = document.createElement('div');
            item.className = `historico-item ${operacao.tipo}`;
            item.innerHTML = `
                <span>${operacao.tipo.toUpperCase()}</span>
                <span>${operacao.data}</span>
            `;
            historicoLista.appendChild(item);
        });
    }

    winButton.addEventListener('click', () => adicionarOperacao('win'));
    lossButton.addEventListener('click', () => adicionarOperacao('loss'));
    voltarButton.addEventListener('click', desfazerUltimaOperacao);
    apagarButton.addEventListener('click', apagarHistorico);

    atualizarEstatisticas();
    atualizarHistoricoLista();
});