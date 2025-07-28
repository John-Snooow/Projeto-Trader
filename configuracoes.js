document.addEventListener('DOMContentLoaded', () => {
    const exportarDadosBtn = document.getElementById('exportarDados');
    const importarDadosInput = document.getElementById('importarDados');

    exportarDadosBtn.addEventListener('click', () => {
        const historico = localStorage.getItem('historico');
        if (historico) {
            const blob = new Blob([historico], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'historico_trader.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert('Nenhum histórico para exportar.');
        }
    });

    importarDadosInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const historicoImportado = JSON.parse(e.target.result);
                    if (Array.isArray(historicoImportado)) {
                        localStorage.setItem('historico', JSON.stringify(historicoImportado));
                        alert('Histórico importado com sucesso!');
                        // Atualizar estatísticas após importação
                        let totalWin = 0;
                        let totalLoss = 0;
                        historicoImportado.forEach(op => {
                            if (op.tipo === 'win') totalWin++;
                            else if (op.tipo === 'loss') totalLoss++;
                        });
                        localStorage.setItem('totalWin', totalWin);
                        localStorage.setItem('totalLoss', totalLoss);
                    } else {
                        alert('Arquivo JSON inválido.');
                    }
                } catch (error) {
                    alert('Erro ao ler o arquivo JSON.');
                }
            };
            reader.readAsText(file);
        }
    });
});
