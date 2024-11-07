// Arquivo: pc101-gui.js

// Importações dos módulos necessários
import { assemble, OPCODES } from './a101.js';
import {
    memory,
    CODE_MEMORY_LIMIT,
    DATA_MEMORY_START,
    loadMachineCode,
    executeProgram,
    executeOpcode,
    resetSimulator,
    getDataBus,
    setDataBus,
    getControlBus,
    setControlBus,
    getIRQ1,
    setIRQ1,
    getIRQ2,
    setIRQ2,
    getCurrentOpcode,
    getRegisterValue,
    setRegisterValue,
    executeNextInstruction, // Importante para o modo passo a passo
    getIP,
    setIP,
    // Novas importações
    setLogCallback,
    setUpdateDisplayCallback,
} from './pc101.js';

// Variáveis da interface
let programLoaded = false;
let stepMode = false;
let inputValue = "";

// Inicialização da interface ao carregar a página
window.addEventListener('load', () => {
    // Definir callbacks para log e atualização de display
    setLogCallback(logMessage);
    setUpdateDisplayCallback(updateDisplayFromDataBus);

    updateMemoryView();
    updateRegistersView();
    updateBusesView();
});

// Função para montar o código e carregar o programa
function assembleAndLoad() {
    const codeInput = document.getElementById('codeInput').value;
    const result = assemble(codeInput);

    if (result.success) {
        loadMachineCode(result.machineCode);
        programLoaded = true;
        stepMode = false;
        updateMachineCodeView(result.machineCode);
        updateMemoryView();
        updateRegistersView();
        logMessage('Montagem concluída e programa carregado na memória.');
    } else {
        logMessage('Erro na montagem:');
        result.errors.forEach(error => logMessage(error));
    }
}

// Função para atualizar a visualização do código de máquina
function updateMachineCodeView(machineCode) {
    const machineCodeDiv = document.getElementById('machineCode');
    machineCodeDiv.innerHTML = '';

    const format = document.getElementById('codeFormat').value;

    for (let i = 0; i < machineCode.length; i++) {
        const line = document.createElement('div');
        const addressStr = formatValue(i, format);
        const valueStr = formatValue(machineCode[i], format, 8);
        line.textContent = `Memória[${addressStr}]: ${valueStr}`;
        machineCodeDiv.appendChild(line);
    }
}

// Função para formatar valores de acordo com o formato selecionado
function formatValue(value, format, bitLength = 8) {
    switch (format) {
        case 'binary':
            return value.toString(2).padStart(bitLength, '0');
        case 'hexadecimal':
            return '0x' + value.toString(16).toUpperCase().padStart(Math.ceil(bitLength / 4), '0');
        case 'decimal':
        default:
            return value.toString(10);
    }
}

// Função para executar o programa completamente
function runProgram() {
    if (!programLoaded) {
        logMessage('Erro: Nenhum programa carregado na memória.');
        return;
    }
    stepMode = false;
    executeProgram();
    updateRegistersView();
    updateMemoryView();
    highlightActiveElements();
}

// Função para executar o programa passo a passo
function stepProgram() {
    if (!programLoaded) {
        logMessage('Erro: Nenhum programa carregado na memória.');
        return;
    }
    if (!stepMode) {
        stepMode = true;
        if (getIP() === 0) {
            logMessage('Modo passo a passo iniciado.');
        }
    }

    if (getIP() < CODE_MEMORY_LIMIT && memory[getIP()] !== 0) {
        executeNextInstruction();
        updateRegistersView();
        updateMemoryView();
    } else {
        logMessage('Execução completa ou nenhum código para executar.');
        stepMode = false;
    }
}

// Função para resetar o simulador
function resetSimulatorGUI() {
    resetSimulator();
    programLoaded = false;
    stepMode = false;
    inputValue = '';
    document.getElementById('codeInput').value = '';
    document.getElementById('machineCode').innerHTML = '';
    document.getElementById('display').innerText = '0';
    document.getElementById('logConsole').innerHTML = '';
    updateRegistersView();
    updateMemoryView();
    updateBusesView();
    logMessage('Simulador resetado.');
}

// Função para atualizar a visualização dos registradores
function updateRegistersView() {
    const format = document.getElementById('codeFormat').value;
    document.getElementById('regA').innerText = formatValue(getRegisterValue('A'), format, 8);
    document.getElementById('regB').innerText = formatValue(getRegisterValue('B'), format, 8);
    document.getElementById('regC').innerText = formatValue(getRegisterValue('C'), format, 8);
    document.getElementById('regIP').innerText = formatValue(getIP(), format, 8);
}

// Função para atualizar a visualização dos barramentos
function updateBusesView() {
    const format = document.getElementById('codeFormat').value;
    document.getElementById('addressBus').innerText = formatValue(getIP(), format, 8);
    document.getElementById('dataBus').innerText = formatValue(getDataBus(), format, 8);
}

// Função para atualizar a visualização da memória
function updateMemoryView() {
    const memoryTableBody = document.querySelector('#memoryTable tbody');
    if (!memoryTableBody) return;
    memoryTableBody.innerHTML = '';

    const format = document.getElementById('codeFormat').value;
    const IPValue = getIP();

    for (let i = 0; i < memory.length; i++) {
        const row = document.createElement('tr');

        const addrCell = document.createElement('td');
        addrCell.innerText = formatValue(i, format, 8);
        row.appendChild(addrCell);

        const valueCell = document.createElement('td');
        valueCell.innerText = formatValue(memory[i], format, 8);
        row.appendChild(valueCell);

        // Destaca a área de código e dados
        if (i < CODE_MEMORY_LIMIT) {
            row.classList.add('code-area'); // Classe para estilizar a área de código
        } else if (i >= DATA_MEMORY_START) {
            row.classList.add('data-area'); // Classe para estilizar a área de dados
        }

        // Destaque da instrução atual
        if (i === IPValue) {
            row.classList.add('current-instruction');
        }

        memoryTableBody.appendChild(row);
    }
}

// Função para registrar mensagens no console de log
function logMessage(message) {
    const logConsole = document.getElementById('logConsole');
    const messagePara = document.createElement('p');
    messagePara.innerText = message;
    logConsole.appendChild(messagePara);
    logConsole.scrollTop = logConsole.scrollHeight;
}

// Função para manipular a entrada do teclado virtual
function handleKeyboardInput(event) {
    const key = event.target.getAttribute('data-key');
    if (key !== null) {
        inputValue += key;
        updateDisplay();
    } else if (event.target.id === 'clearKey') {
        inputValue = '';
        updateDisplay();
    } else if (event.target.id === 'enterKey') {
        sendToDataBus();
    }
}

// Função para atualizar o display
function updateDisplay() {
    document.getElementById('display').innerText = inputValue || '0';
}

// Função para enviar o valor de entrada para o dataBus
function sendToDataBus() {
    if (inputValue) {
        setDataBus(parseInt(inputValue, 10));
        const control = getControlBus();
        control.io = true;
        setControlBus(control);
        logMessage(`Valor enviado para o dataBus: ${getDataBus()}`);
        inputValue = '';
        updateDisplay();
        updateBusesView();
        setIRQ1(true); // Sinaliza a interrupção IRQ1
        // Não é mais necessário chamar checkInterrupts() aqui
    }
}

// Função para atualizar o display a partir do dataBus
function updateDisplayFromDataBus(value) {
    document.getElementById('display').innerText = value;
    updateBusesView();
}

// Associação de eventos aos elementos da interface
document.getElementById('assembleButton').addEventListener('click', assembleAndLoad);
document.getElementById('runButton').addEventListener('click', runProgram);
document.getElementById('stepButton').addEventListener('click', stepProgram);
document.getElementById('resetButton').addEventListener('click', resetSimulatorGUI);
document.getElementById('codeFormat').addEventListener('change', () => {
    updateMachineCodeView(memory.slice(0, CODE_MEMORY_LIMIT));
    updateRegistersView();
    updateMemoryView();
    updateBusesView();
});

// Eventos do teclado virtual
document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('click', handleKeyboardInput);
});

// Sobrescreve console.log para registrar no console de log da interface
(function() {
    const originalLog = console.log;
    console.log = function(message) {
        originalLog.apply(console, arguments);
        logMessage(message);
    };
})();

// Função para destacar elementos ativos
function highlightActiveElements() {
    // Limpa destaques anteriores
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));

    const currentOpcode = getCurrentOpcode();

    // Destaca registradores e barramentos usados
    if ([OPCODES.LOAD, OPCODES.ADD, OPCODES.SUB, OPCODES.STORE, OPCODES.INC, OPCODES.DEC].includes(currentOpcode)) {
        document.getElementById('regA').parentElement.classList.add('highlight');
    }

    if (currentOpcode === OPCODES.IN || currentOpcode === OPCODES.OUT) {
        document.getElementById('dataBus').parentElement.classList.add('highlight');
    }

    // Atualiza a visualização da memória para destacar a instrução atual
    updateMemoryView();
}