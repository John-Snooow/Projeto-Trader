        // Global variables
        let currentBankValue = 0;
        let currentOperations = [];
        let selectedDate = new Date();
        let currentViewDate = new Date();
        let operationsHistory = {};
        let globalStats = {
            total: 0,
            wins: 0,
            losses: 0
        };

        // DOM Elements
        const pages = {
            calculator: document.getElementById('calculator-page'),
            history: document.getElementById('history-page'),
            settings: document.getElementById('settings-page')
        };

        const navLinks = {
            calculator: document.getElementById('nav-calculator'),
            history: document.getElementById('nav-history'),
            settings: document.getElementById('nav-settings')
        };

        // Calculator elements
        const calculatorElements = {
            bankValue: document.getElementById('bank-value'),
            payout: document.getElementById('payout'),
            desiredReturn: document.getElementById('desired-return'),
            returnType: document.getElementById('return-type'),
            martingales: document.getElementById('martingales'),
            operationType: document.getElementById('operation-type'),
            calculateBtn: document.getElementById('calculate-btn'),
            resultsSection: document.getElementById('results-section'),
            resultsTable: document.getElementById('results-table'),
            currentBalance: document.getElementById('current-balance'),
            balanceValue: document.getElementById('balance-value'),
        };

        // History elements
        const historyElements = {
            totalOperations: document.getElementById('total-operations'),
            totalWins: document.getElementById('total-wins'),
            totalLosses: document.getElementById('total-losses'),
            winRate: document.getElementById('win-rate'),
            dailyStats: document.getElementById('daily-stats'),
            selectedDate: document.getElementById('selected-date'),
            dailyWins: document.getElementById('daily-wins'),
            dailyLosses: document.getElementById('daily-losses'),
            dailyProgress: document.getElementById('daily-progress'),
            operationsList: document.getElementById('operations-list'),
            prevMonth: document.getElementById('prev-month'),
            nextMonth: document.getElementById('next-month'),
            currentMonth: document.getElementById('current-month'),
            calendarDays: document.getElementById('calendar-days'),
            registerWin: document.getElementById('register-win'),
            registerLoss: document.getElementById('register-loss'),
            backToToday: document.getElementById('back-to-today'),
            deleteHistory: document.getElementById('delete-history')
        };

        // Settings elements
        const settingsElements = {
            themeBtns: document.querySelectorAll('.theme-btn'),
            exportData: document.getElementById('export-data'),
            importBtn: document.getElementById('import-btn'),
            importFile: document.getElementById('import-file'),
            resetAll: document.getElementById('reset-all')
        };

        // Initialize the app
        document.addEventListener('DOMContentLoaded', () => {
            // Load saved data from localStorage
            loadData();
            
            // Set up navigation
            setupNavigation();
            
            // Set up calculator
            setupCalculator();
            
            // Set up history
            setupHistory();
            
            // Set up settings
            setupSettings();
            
            // Update UI with loaded data
            updateGlobalStats();
            generateCalendar();
        });

        // Navigation functions
        function setupNavigation() {
            navLinks.calculator.addEventListener('click', () => showPage('calculator'));
            navLinks.history.addEventListener('click', () => showPage('history'));
            navLinks.settings.addEventListener('click', () => showPage('settings'));
        }

        function showPage(pageName) {
            // Hide all pages
            Object.values(pages).forEach(page => page.classList.add('hidden'));
            
            // Remove active class from all nav links
            Object.values(navLinks).forEach(link => link.classList.remove('active'));
            
            // Show selected page and mark nav link as active
            pages[pageName].classList.remove('hidden');
            navLinks[pageName].classList.add('active');
        }

        // Data management functions
        function loadData() {
            // Load theme
            const savedTheme = localStorage.getItem('trader-theme') || 'dark';
            document.body.setAttribute('data-theme', savedTheme);
            
            // Load calculator state
            const savedCalculatorState = localStorage.getItem('trader-calculator-state');
            if (savedCalculatorState) {
                const state = JSON.parse(savedCalculatorState);
                calculatorElements.bankValue.value = state.bankValue || '';
                if (state.currentBankValue) {
                    currentBankValue = parseFloat(state.currentBankValue);
                    calculatorElements.bankValue.value = currentBankValue.toFixed(2);
                    updateBalanceDisplay();
                }
                calculatorElements.payout.value = state.payout || '';
                calculatorElements.desiredReturn.value = state.desiredReturn || '';
                calculatorElements.returnType.value = state.returnType || 'percent';
                calculatorElements.martingales.value = state.martingales || '1';
                calculatorElements.operationType.value = state.operationType || 'moderate';
                
                if (state.currentBankValue) {
                    currentBankValue = parseFloat(state.currentBankValue);
                    updateBalanceDisplay();
                }
                
                if (state.currentOperations && state.currentOperations.length > 0) {
                    currentOperations = state.currentOperations;
                    displayResults();
                }
            }
            
            // Load operations history
            const savedHistory = localStorage.getItem('trader-operations-history');
            if (savedHistory) {
                operationsHistory = JSON.parse(savedHistory);
            }
            
            // Load global stats
            const savedStats = localStorage.getItem('trader-global-stats');
            if (savedStats) {
                globalStats = JSON.parse(savedStats);
            }
        }

        function saveData() {
            // Save calculator state
            const calculatorState = {
                bankValue: calculatorElements.bankValue.value,
                payout: calculatorElements.payout.value,
                desiredReturn: calculatorElements.desiredReturn.value,
                returnType: calculatorElements.returnType.value,
                martingales: calculatorElements.martingales.value,
                operationType: calculatorElements.operationType.value,
                currentBankValue: currentBankValue,
                currentOperations: currentOperations
            };
            localStorage.setItem('trader-calculator-state', JSON.stringify(calculatorState));
            
            // Save operations history
            localStorage.setItem('trader-operations-history', JSON.stringify(operationsHistory));
            
            // Save global stats
            localStorage.setItem('trader-global-stats', JSON.stringify(globalStats));
        }

        // Calculator functions
        function setupCalculator() {
            calculatorElements.calculateBtn.addEventListener('click', calculateEntries);
            document.getElementById('save-operation').addEventListener('click', saveOperation);
        }

        function calculateEntries() {
            // Get input values
            const bankValue = parseFloat(calculatorElements.bankValue.value);
            const payout = parseFloat(calculatorElements.payout.value) / 100;
            const desiredReturn = parseFloat(calculatorElements.desiredReturn.value);
            const isPercentReturn = calculatorElements.returnType.value === 'percent';
            const martingales = parseInt(calculatorElements.martingales.value);
            const operationType = calculatorElements.operationType.value;
            
            // Validate inputs
            if (!bankValue || !payout || !desiredReturn) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Set multiplier based on operation type
            let multiplier;
            switch (operationType) {
                case 'conservative': multiplier = 2.25; break;
                case 'moderate': multiplier = 2.5; break;
                case 'aggressive': multiplier = 3.0; break;
                default: multiplier = 2.5;
            }
            
            // Calculate desired return in R$ if percentage was selected
            const desiredReturnValue = isPercentReturn ? bankValue * (desiredReturn / 100) : desiredReturn;
            
            // Calculate first entry
            const firstEntry = desiredReturnValue / payout;
            
            // Generate martingale sequence
            currentOperations = [];
            currentBankValue = bankValue;
            
            for (let i = 0; i < martingales; i++) {
                const entryValue = i === 0 ? firstEntry : currentOperations[i-1].entryValue * multiplier;
                const expectedReturn = entryValue * payout;
                const bankPercentage = (entryValue / bankValue) * 100;
                
                currentOperations.push({
                    number: i + 1,
                    entryValue: entryValue,
                    expectedReturn: expectedReturn,
                    bankPercentage: bankPercentage,
                    result: null
                });
            }
            
            // Display results
            displayResults();
            
            // Save data
            saveData();
        }

        function displayResults() {
            // Clear previous results
            calculatorElements.resultsTable.innerHTML = '';
            
            // Add rows for each operation
            currentOperations.forEach(op => {
                const row = document.createElement('tr');
                row.className = 'border-b border-slate-700 hover:bg-slate-800';
                row.innerHTML = `
                    <td class="p-3">${op.number}</td>
                    <td class="p-3">R$ ${op.entryValue.toFixed(2)}</td>
                    <td class="p-3">R$ ${op.expectedReturn.toFixed(2)}</td>
                    <td class="p-3">${op.bankPercentage.toFixed(2)}%</td>
                    <td class="p-3">
                        <div class="flex space-x-4">
                            <label class="inline-flex items-center">
                                <input type="radio" name="result-${op.number}" value="win" class="form-radio h-5 w-5 text-green-500" ${op.result === 'win' ? 'checked' : ''}>
                                <span class="ml-2">WIN</span>
                            </label>
                            <label class="inline-flex items-center">
                                <input type="radio" name="result-${op.number}" value="loss" class="form-radio h-5 w-5 text-red-500" ${op.result === 'loss' ? 'checked' : ''}>
                                <span class="ml-2">LOSS</span>
                            </label>
                        </div>
                    </td>
                `;
                
                // Add event listeners to radio buttons
                const winRadio = row.querySelector(`input[value="win"]`);
                const lossRadio = row.querySelector(`input[value="loss"]`);
                
                winRadio.addEventListener('change', () => updateOperationResult(op.number, 'win'));
                lossRadio.addEventListener('change', () => updateOperationResult(op.number, 'loss'));
                
                calculatorElements.resultsTable.appendChild(row);
            });
            
            // Show results section
            calculatorElements.resultsSection.classList.remove('hidden');
            
            // Update balance display
            updateBalanceDisplay();
        }

        function updateOperationResult(opNumber, result) {
            const operation = currentOperations.find(op => op.number === opNumber);
            if (operation) {
                // If operation already had a result, we need to undo its effect first
                if (operation.result === 'win') {
                    currentBankValue -= operation.expectedReturn;
                } else if (operation.result === 'loss') {
                    currentBankValue += operation.entryValue;
                }
                
                // Set new result
                operation.result = result;
                
                // Apply new result's effect
                if (result === 'win') {
                    currentBankValue += operation.expectedReturn;
                } else if (result === 'loss') {
                    currentBankValue -= operation.entryValue;
                }
                
                // Update bank value input and balance display
                calculatorElements.bankValue.value = currentBankValue.toFixed(2);
                updateBalanceDisplay();
                
                // Save data
                saveData();
            }
        }

        function updateBalanceDisplay() {
            calculatorElements.balanceValue.textContent = currentBankValue.toFixed(2);
            
            if (currentBankValue >= parseFloat(calculatorElements.bankValue.value || 0)) {
                calculatorElements.currentBalance.className = 'text-lg font-bold px-4 py-2 rounded-md bg-green-900 text-green-100';
            } else {
                calculatorElements.currentBalance.className = 'text-lg font-bold px-4 py-2 rounded-md bg-red-900 text-red-100';
            }
        }

        function saveOperation() {
            // Check if there are any operations to save
            if (currentOperations.length === 0) {
                alert('Nenhuma operação para salvar. Por favor, calcule as entradas primeiro.');
                return;
            }
            
            // Check if all operations have a result
            const incompleteOperations = currentOperations.filter(op => op.result === null);
            if (incompleteOperations.length > 0) {
                alert('Por favor, defina o resultado para todas as entradas antes de salvar.');
                return;
            }
            
            // Get current date as key (YYYY-MM-DD)
            const today = new Date().toISOString().split('T')[0];
            
            // Create operation object
            const operation = {
                date: new Date().toISOString(),
                initialBank: parseFloat(calculatorElements.bankValue.value),
                finalBank: currentBankValue,
                operations: [...currentOperations],
                payout: parseFloat(calculatorElements.payout.value),
                martingales: parseInt(calculatorElements.martingales.value),
                operationType: calculatorElements.operationType.value,
                desiredReturn: parseFloat(calculatorElements.desiredReturn.value),
                returnType: calculatorElements.returnType.value
            };
            
            // Add to history
            if (!operationsHistory[today]) {
                operationsHistory[today] = [];
            }
            operationsHistory[today].push(operation);
            
            // Update global stats
            const wins = currentOperations.filter(op => op.result === 'win').length;
            const losses = currentOperations.filter(op => op.result === 'loss').length;
            
            globalStats.total += wins + losses;
            globalStats.wins += wins;
            globalStats.losses += losses;
            
            // Save data
            saveData();
            
            // Update UI
            updateGlobalStats();
            generateCalendar();
            updateChart();
            
            // Reset calculator
            resetCalculator();
            
            // Show success message
            alert('Operação salva com sucesso no histórico!');
            
            // Switch to history page
            showPage('history');
            goToToday();
        }

        function resetCalculator() {
            currentOperations = [];
            calculatorElements.resultsSection.classList.add('hidden');
            calculatorElements.bankValue.value = currentBankValue > 0 ? currentBankValue.toFixed(2) : '';
            
            // Save data
            saveData();
        }

        // Chart variables
        let historyChart;
        
        // History functions
        function setupHistory() {
            // Initialize chart
            const ctx = document.getElementById('history-chart').getContext('2d');
            historyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Wins',
                            backgroundColor: '#10b981',
                            data: []
                        },
                        {
                            label: 'Losses',
                            backgroundColor: '#ef4444',
                            data: []
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            // Add chart controls event listeners
            document.getElementById('time-period').addEventListener('change', updateChart);
            document.getElementById('chart-type').addEventListener('change', function() {
                historyChart.config.type = this.value;
                historyChart.update();
            });
            
            // Initial chart update
            updateChart();
            historyElements.prevMonth.addEventListener('click', () => {
                currentViewDate.setMonth(currentViewDate.getMonth() - 1);
                generateCalendar();
            });
            
            historyElements.nextMonth.addEventListener('click', () => {
                currentViewDate.setMonth(currentViewDate.getMonth() + 1);
                generateCalendar();
            });
            
            historyElements.registerWin.addEventListener('click', () => registerQuickOperation('win'));
            historyElements.registerLoss.addEventListener('click', () => registerQuickOperation('loss'));
            historyElements.backToToday.addEventListener('click', goToToday);
            historyElements.deleteHistory.addEventListener('click', confirmDeleteHistory);
        }

        function generateCalendar() {
            // Set month/year display
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            historyElements.currentMonth.textContent = `${monthNames[currentViewDate.getMonth()]} ${currentViewDate.getFullYear()}`;
            
            // Get first day of month and days in month
            const firstDay = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1).getDay();
            const daysInMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0).getDate();
            
            // Clear calendar
            historyElements.calendarDays.innerHTML = '';
            
            // Add empty cells for days before first day of month
            for (let i = 0; i < firstDay; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'h-8';
                historyElements.calendarDays.appendChild(emptyCell);
            }
            
            // Add cells for each day of month
            for (let i = 1; i <= daysInMonth; i++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                dayCell.textContent = i;
                
                // Create date string for this day (YYYY-MM-DD)
                const dateStr = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                
                // Check if there are operations for this day
                if (operationsHistory[dateStr]) {
                    const dayOperations = operationsHistory[dateStr];
                    const wins = dayOperations.reduce((acc, op) => acc + op.operations.filter(o => o.result === 'win').length, 0);
                    const losses = dayOperations.reduce((acc, op) => acc + op.operations.filter(o => o.result === 'loss').length, 0);
                    
                    if (wins > 0 && losses === 0) {
                        dayCell.classList.add('win');
                    } else if (losses >= 2) {
                        dayCell.classList.add('multiple-loss');
                    } else if (losses > 0) {
                        dayCell.classList.add('loss');
                    }
                }
                
                // Highlight today
                const today = new Date();
                if (currentViewDate.getFullYear() === today.getFullYear() && 
                    currentViewDate.getMonth() === today.getMonth() && 
                    i === today.getDate()) {
                    dayCell.classList.add('font-bold');
                }
                
                // Highlight selected date
                if (selectedDate && 
                    currentViewDate.getFullYear() === selectedDate.getFullYear() && 
                    currentViewDate.getMonth() === selectedDate.getMonth() && 
                    i === selectedDate.getDate()) {
                    dayCell.classList.add('selected');
                }
                
                // Add click event
                dayCell.addEventListener('click', () => selectDate(i));
                
                historyElements.calendarDays.appendChild(dayCell);
            }
        }

        function selectDate(day) {
            // Set selected date
            selectedDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day);
            
            // Generate calendar to update selected state
            generateCalendar();
            
            // Show operations for selected date
            showDateOperations();
        }

        function showDateOperations() {
            // Create date string (YYYY-MM-DD)
            const dateStr = selectedDate.toISOString().split('T')[0];
            
            // Update selected date display
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            historyElements.selectedDate.textContent = selectedDate.toLocaleDateString('pt-BR', options);
            
            // Check if there are operations for this date
            const hasOperations = operationsHistory[dateStr] && operationsHistory[dateStr].length > 0;
            
            // Calculate daily stats
            let dailyWins = 0;
            let dailyLosses = 0;
            
            if (hasOperations) {
                const dayOperations = operationsHistory[dateStr];
                dayOperations.forEach(op => {
                    dailyWins += op.operations.filter(o => o.result === 'win').length;
                    dailyLosses += op.operations.filter(o => o.result === 'loss').length;
                });
            }
            
            // Update daily stats
            historyElements.dailyWins.textContent = dailyWins;
            historyElements.dailyLosses.textContent = dailyLosses;
            
            const total = dailyWins + dailyLosses;
            const winRate = total > 0 ? (dailyWins / total) * 100 : 0;
            historyElements.dailyProgress.style.width = `${winRate}%`;
            
            // Update global stats display
            updateGlobalStats();
            
            // Show/hide daily stats
            if (hasOperations) {
                historyElements.dailyStats.classList.remove('hidden');
            } else {
                historyElements.dailyStats.classList.add('hidden');
            }
            
            // Display operations
            historyElements.operationsList.innerHTML = '';
            
            if (hasOperations) {
                const dayOperations = operationsHistory[dateStr];
                
                dayOperations.forEach((op, index) => {
                    const opElement = document.createElement('div');
                    opElement.className = 'card p-4 mb-3';
                    
                    // Calculate operation stats
                    const opWins = op.operations.filter(o => o.result === 'win').length;
                    const opLosses = op.operations.filter(o => o.result === 'loss').length;
                    const opWinRate = opWins + opLosses > 0 ? (opWins / (opWins + opLosses)) * 100 : 0;
                    
                    opElement.innerHTML = `
                        <div class="flex justify-between items-center mb-2">
                            <div class="font-bold">Operação #${index + 1}</div>
                            <div class="text-sm">${new Date(op.date).toLocaleTimeString('pt-BR')}</div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 mb-2">
                            <div>
                                <div class="text-sm text-gray-400">Banca Inicial</div>
                                <div>R$ ${op.initialBank.toFixed(2)}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-400">Banca Final</div>
                                <div class="${op.finalBank >= op.initialBank ? 'text-green-500' : 'text-red-500'}">
                                    R$ ${op.finalBank.toFixed(2)}
                                </div>
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-2 mb-2">
                            <div>
                                <div class="text-sm text-gray-400">Wins</div>
                                <div class="text-green-500">${opWins}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-400">Losses</div>
                                <div class="text-red-500">${opLosses}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-400">Taxa</div>
                                <div>${opWinRate.toFixed(1)}%</div>
                            </div>
                        </div>
                        <div class="mt-2 pt-2 border-t border-slate-700">
                            <div class="text-sm text-gray-400">Configurações</div>
                            <div class="text-sm grid grid-cols-2 gap-2">
                                <div>Entrada: R$ ${op.operations[0].entryValue.toFixed(2)}</div>
                                <div>Payout: ${op.payout}%</div>
                                <div>Tipo: ${getOperationTypeName(op.operationType)}</div>
                                <div>Martingales: ${op.martingales}</div>
                            </div>
                        </div>
                        <div class="mt-2 pt-2 border-t border-slate-700">
                            <div class="text-sm text-gray-400">Operações</div>
                            ${op.operations.map(operation => `
                                <div class="text-sm grid grid-cols-4 gap-2 mb-1 ${operation.result === 'win' ? 'text-green-500' : 'text-red-500'}">
                                    <div>#${operation.number}</div>
                                    <div>R$ ${operation.entryValue.toFixed(2)}</div>
                                    <div>R$ ${operation.expectedReturn.toFixed(2)}</div>
                                    <div>${operation.result === 'win' ? 'WIN' : 'LOSS'}</div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    
                    historyElements.operationsList.appendChild(opElement);
                });
            } else {
                // No operations for this date
                historyElements.operationsList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-calendar-times text-4xl mb-2"></i>
                        <p>Nenhuma operação registrada neste dia</p>
                    </div>
                `;
            }
        }

        function getOperationTypeName(type) {
            switch (type) {
                case 'conservative': return 'Conservador';
                case 'moderate': return 'Moderado';
                case 'aggressive': return 'Agressivo';
                default: return type;
            }
        }

        function registerQuickOperation(result) {
            if (!selectedDate) {
                alert('Por favor, selecione uma data no calendário primeiro.');
                return;
            }
            
            const dateStr = selectedDate.toISOString().split('T')[0];
            const now = new Date();
            
            // Create a simple operation with just the result
            // Get current bank value or use 0 if not set
            const currentBank = currentBankValue || parseFloat(calculatorElements.bankValue.value) || 0;
            const entryValue = Math.max(1, currentBank * 0.01); // Use 1% of bank or minimum 1
            
            const operation = {
                date: now.toISOString(),
                initialBank: currentBank,
                finalBank: result === 'win' ? currentBank + entryValue : currentBank - entryValue,
                operations: [{
                    number: 1,
                    entryValue: entryValue,
                    expectedReturn: entryValue,
                    bankPercentage: (entryValue / currentBank) * 100,
                    result: result
                }],
                payout: 100,
                martingales: 1,
                operationType: 'quick',
                desiredReturn: entryValue,
                returnType: 'fixed'
            };
            
            // Update current bank value
            currentBankValue = operation.finalBank;
            calculatorElements.bankValue.value = currentBankValue.toFixed(2);
            updateBalanceDisplay();
            
            // Add to history
            if (!operationsHistory[dateStr]) {
                operationsHistory[dateStr] = [];
            }
            operationsHistory[dateStr].push(operation);
            
            // Update global stats
            globalStats.total += 1;
            if (result === 'win') {
                globalStats.wins += 1;
            } else {
                globalStats.losses += 1;
            }
            
            // Save data
            saveData();
            
            // Update UI
            updateGlobalStats();
            generateCalendar();
            showDateOperations();
            
            // Show success message
            alert(`Operação ${result === 'win' ? 'WIN' : 'LOSS'} registrada com sucesso!`);
        }

        function goToToday() {
            selectedDate = new Date();
            currentViewDate = new Date();
            generateCalendar();
            showDateOperations();
        }

        function confirmDeleteHistory() {
            if (confirm('Tem certeza que deseja apagar todo o histórico? Esta ação não pode ser desfeita.')) {
                operationsHistory = {};
                globalStats = { total: 0, wins: 0, losses: 0 };
                
                // Save data
                saveData();
                
                // Update UI
                updateGlobalStats();
                generateCalendar();
                showDateOperations();
                
                alert('Histórico apagado com sucesso!');
            }
        }

        function updateChart() {
            const period = document.getElementById('time-period').value;
            let labels = [];
            let winsData = [];
            let lossesData = [];
            
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            
            if (period === 'day') {
                // Last 30 days
                for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    labels.push(date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}));
                    
                    if (operationsHistory[dateStr]) {
                        const dayOps = operationsHistory[dateStr];
                        winsData.push(dayOps.reduce((acc, op) => acc + op.operations.filter(o => o.result === 'win').length, 0));
                        lossesData.push(dayOps.reduce((acc, op) => acc + op.operations.filter(o => o.result === 'loss').length, 0));
                    } else {
                        winsData.push(0);
                        lossesData.push(0);
                    }
                }
            } else if (period === 'month') {
                // Last 12 months
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                
                for (let i = 11; i >= 0; i--) {
                    const month = (currentMonth - i + 12) % 12;
                    const year = currentYear - Math.floor((i - currentMonth) / 12);
                    
                    labels.push(`${monthNames[month]}/${year}`);
                    
                    let monthWins = 0;
                    let monthLosses = 0;
                    
                    // Check each day in the month
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        if (operationsHistory[dateStr]) {
                            const dayOps = operationsHistory[dateStr];
                            monthWins += dayOps.reduce((acc, op) => acc + op.operations.filter(o => o.result === 'win').length, 0);
                            monthLosses += dayOps.reduce((acc, op) => acc + op.operations.filter(o => o.result === 'loss').length, 0);
                        }
                    }
                    
                    winsData.push(monthWins);
                    lossesData.push(monthLosses);
                }
            } else { // year
                // Last 5 years
                for (let i = 4; i >= 0; i--) {
                    const year = currentYear - i;
                    labels.push(year.toString());
                    
                    let yearWins = 0;
                    let yearLosses = 0;
                    
                    // Check each month in the year
                    for (let month = 0; month < 12; month++) {
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        for (let day = 1; day <= daysInMonth; day++) {
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            if (operationsHistory[dateStr]) {
                                const dayOps = operationsHistory[dateStr];
                                yearWins += dayOps.reduce((acc, op) => acc + op.operations.filter(o => o.result === 'win').length, 0);
                                yearLosses += dayOps.reduce((acc, op) => acc + op.operations.filter(o => o.result === 'loss').length, 0);
                            }
                        }
                    }
                    
                    winsData.push(yearWins);
                    lossesData.push(yearLosses);
                }
            }
            
            // Update chart data
            historyChart.data.labels = labels;
            historyChart.data.datasets[0].data = winsData;
            historyChart.data.datasets[1].data = lossesData;
            historyChart.update();
        }

        function updateGlobalStats() {
            historyElements.totalOperations.textContent = globalStats.total;
            historyElements.totalWins.textContent = globalStats.wins;
            historyElements.totalLosses.textContent = globalStats.losses;
            
            const winRate = globalStats.total > 0 ? (globalStats.wins / globalStats.total) * 100 : 0;
            historyElements.winRate.textContent = winRate.toFixed(1) + '%';
        }

        // Settings functions
        function setupSettings() {
            // Theme selection
            settingsElements.themeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const theme = btn.getAttribute('data-theme');
                    document.body.setAttribute('data-theme', theme);
                    localStorage.setItem('trader-theme', theme);
                    
                    // Update button borders
                    settingsElements.themeBtns.forEach(b => {
                        if (b === btn) {
                            b.classList.add('border-blue-500');
                            b.classList.remove('border-transparent');
                        } else {
                            b.classList.remove('border-blue-500');
                            b.classList.add('border-transparent');
                        }
                    });
                });
            });
            
            // Export data
            settingsElements.exportData.addEventListener('click', exportData);
            
            // Import data
            settingsElements.importBtn.addEventListener('click', () => settingsElements.importFile.click());
            settingsElements.importFile.addEventListener('change', importData);
            
            // Reset all
            settingsElements.resetAll.addEventListener('click', confirmResetAll);
        }

        function exportData() {
            const data = {
                calculatorState: JSON.parse(localStorage.getItem('trader-calculator-state') || '{}'),
                operationsHistory: JSON.parse(localStorage.getItem('trader-operations-history') || '{}'),
                globalStats: JSON.parse(localStorage.getItem('trader-global-stats') || '{}'),
                theme: localStorage.getItem('trader-theme') || 'dark'
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const dataUrl = URL.createObjectURL(dataBlob);
            
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `projeto-trader-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => URL.revokeObjectURL(dataUrl), 100);
        }

        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (confirm('Isso substituirá todos os seus dados atuais. Tem certeza que deseja continuar?')) {
                        if (data.calculatorState) {
                            localStorage.setItem('trader-calculator-state', JSON.stringify(data.calculatorState));
                        }
                        
                        if (data.operationsHistory) {
                            localStorage.setItem('trader-operations-history', JSON.stringify(data.operationsHistory));
                            operationsHistory = data.operationsHistory;
                        }
                        
                        if (data.globalStats) {
                            localStorage.setItem('trader-global-stats', JSON.stringify(data.globalStats));
                            globalStats = data.globalStats;
                        }
                        
                        if (data.theme) {
                            localStorage.setItem('trader-theme', data.theme);
                            document.body.setAttribute('data-theme', data.theme);
                        }
                        
                        // Reload the app
                        location.reload();
                    }
                } catch (error) {
                    alert('Erro ao importar dados: O arquivo pode estar corrompido ou no formato incorreto.');
                }
            };
            reader.readAsText(file);
            
            // Reset file input
            event.target.value = '';
        }

        function confirmResetAll() {
            if (confirm('Tem certeza que deseja redefinir TODAS as configurações e apagar TODOS os dados? Esta ação não pode ser desfeita.')) {
                localStorage.clear();
                location.reload();
            }
        }