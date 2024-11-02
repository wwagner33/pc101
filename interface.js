// Arquivo: interface.js

// Variável para controlar o modo de execução passo a passo
let stepMode = false;

// Variável para armazenar se o programa foi carregado
let programLoaded = false;

// Variável para armazenar o valor de entrada do usuário
let inputValue = "";

// Função para montar o código
function assembleCode() {
    // Obtém o código do campo de entrada
    const codeInput = document.getElementById("codeInput").value;

    // Monta o programa a partir do código inserido
    const assemblySuccess = assembleAndLoad(codeInput);

    if (assemblySuccess) {
        logMessage("Montagem concluída com sucesso.");
        updateMachineCodeView();
        document.getElementById("loadButton").disabled = false; // Habilita o botão de carregar
    } else {
        logMessage("Montagem falhou. Verifique os erros.");
    }
}

// Função para exibir o código de máquina
function updateMachineCodeView() {
    const machineCodeDiv = document.getElementById("machineCode");
    machineCodeDiv.innerHTML = ""; // Limpa o conteúdo

    const format = document.getElementById("codeFormat").value;

    for (let i = 0; i < memory.length; i++) {
        if (memory[i] !== 0) {
            const line = document.createElement("div");
            const addressStr = formatValue(i, format);
            const valueStr = formatValue(memory[i], format, 8);
            line.textContent = `Memória[${addressStr}]: ${valueStr}`;
            machineCodeDiv.appendChild(line);
        }
    }
}

// Função para formatar valores de acordo com o formato selecionado
function formatValue(value, format, bitLength = 8) {
    switch (format) {
        case "binary":
            return value.toString(2).padStart(bitLength, '0');
        case "hexadecimal":
            return '0x' + value.toString(16).toUpperCase().padStart(Math.ceil(bitLength / 4), '0');
        case "decimal":
        default:
            return value.toString(10);
    }
}

// Função para carregar o código na memória
function loadToMemory() {
    // Atualiza a visualização da memória
    updateMemoryView();
    logMessage("Programa carregado na memória.");
    programLoaded = true;

    // Desabilita o botão após carregar
    document.getElementById("loadButton").disabled = true;
}

// Função para executar o programa completamente
function runProgram() {
    if (!programLoaded) {
        logMessage("Erro: Nenhum programa carregado na memória.");
        return;
    }
    stepMode = false;
    executeProgram();
    updateRegistersView();
    updateMemoryView();
}

// Função para executar o programa passo a passo
function stepProgram() {
    if (!programLoaded) {
        logMessage("Erro: Nenhum programa carregado na memória.");
        return;
    }
    if (!stepMode) {
        // Inicializa o modo passo a passo
        stepMode = true;
        if (IP === 0) {
            logMessage("Modo passo a passo iniciado.");
        }
    }

    if (IP < CODE_MEMORY_LIMIT && memory[IP] !== 0) {
        executeNextInstruction();
        updateRegistersView();
        updateMemoryView();
    } else {
        logMessage("Execução completa ou nenhum código para executar.");
        stepMode = false;
    }
}

// Função para executar a próxima instrução
function executeNextInstruction() {
    const opcode = memory[IP];
    const operand = memory[IP + 1];

    let instructionFound = false;

    for (const [key, value] of Object.entries(opCodes)) {
        if (parseInt(value, 2) === opcode) {
            instructionFound = true;
            executeInstruction(key, operand);
            // Ajusta o IP com base na instrução
            if (['LOAD', 'ADD', 'SUB', 'STORE', 'INC', 'DEC'].includes(key)) {
                IP += 2;
            } else if (['JMP', 'JZ'].includes(key)) {
                // O IP já foi ajustado dentro da instrução
            } else if (['IN', 'OUT'].includes(key)) {
                IP += 1;
            } else {
                IP += 1;
            }
            break;
        }
    }

    if (!instructionFound) {
        logMessage(`Erro na execução: Instrução desconhecida no endereço ${IP}, valor: ${opcode}`);
        stepMode = false;
    }

    // Verifica se o IP excedeu o limite de memória de código
    if (IP >= CODE_MEMORY_LIMIT) {
        logMessage("Erro: Estouro de Memória de Código durante a execução.");
        stepMode = false;
    }

    // Checagem de interrupções após cada instrução
    checkInterrupts();
}

// Função para checar e tratar interrupções
function checkInterrupts() {
    if (window.IRQ1) {
        handleIRQ1();
        window.IRQ1 = false;
    }
    if (window.IRQ2) {
        handleIRQ2();
        window.IRQ2 = false;
    }
}

// Tratamento da IRQ1 (Interrupção do teclado)
function handleIRQ1() {
    // Neste caso, apenas registramos que a interrupção foi tratada
    logMessage("IRQ1: Interrupção do teclado tratada. Valor disponível no dataBus.");
    // A leitura efetiva será feita pela instrução IN no programa
}

// Tratamento da IRQ2 (Interrupção do display)
function handleIRQ2() {
    // Atualiza o display com o valor do dataBus
    updateDisplayFromDataBus();
    logMessage("IRQ2: Interrupção do display tratada. Display atualizado com o valor do dataBus.");
}

// Função para resetar o simulador
function resetSimulator() {
    // Limpa a memória e registradores
    memory.fill(0);
    A = 0;
    B = 0;
    C = 0;
    IP = 0;
    inputValue = "";
    dataBus = 0;
    controlBus = {
        read: false,
        write: false,
        io: false
    };
    stepMode = false;
    programLoaded = false;

    // Limpa a interface
    document.getElementById("codeInput").value = "";
    document.getElementById("machineCode").innerHTML = "";
    document.getElementById("display").innerText = "0";
    document.getElementById("logConsole").innerHTML = "";
    document.getElementById("loadButton").disabled = true; // Desabilita o botão de carregar
    updateRegistersView();
    updateMemoryView(); // Atualiza a memória para exibir zeros
    updateBusesView();

    logMessage("Simulador resetado.");
}

// Chama a atualização da memória ao carregar a página
window.onload = function() {
    updateMemoryView();      // Exibe a memória com valores zero
    updateRegistersView();   // Atualiza a exibição dos registradores
    updateBusesView();       // Atualiza a exibição dos barramentos
};

// Função para atualizar a visualização dos registradores
function updateRegistersView() {
    const format = document.getElementById("codeFormat").value;
    document.getElementById("regA").innerText = formatValue(A, format, 8);
    document.getElementById("regB").innerText = formatValue(B, format, 8);
    document.getElementById("regC").innerText = formatValue(C, format, 8);
    document.getElementById("regIP").innerText = formatValue(IP, format, 8);
}

// Função para atualizar a visualização dos barramentos
function updateBusesView() {
    const format = document.getElementById("codeFormat").value;
    document.getElementById("addressBus").innerText = formatValue(IP, format, 8);
    document.getElementById("dataBus").innerText = formatValue(dataBus, format, 8);
}

// Função para atualizar a visualização da memória
function updateMemoryView() {
    const memoryTableBody = document.querySelector("#memoryTable tbody");
    memoryTableBody.innerHTML = ""; // Limpa a tabela

    const format = document.getElementById("codeFormat").value;

    for (let i = 0; i < memory.length; i++) {
        const row = document.createElement("tr");

        const addrCell = document.createElement("td");
        addrCell.innerText = formatValue(i, format, 8);
        row.appendChild(addrCell);

        const valueCell = document.createElement("td");
        valueCell.innerText = formatValue(memory[i], format, 8);
        row.appendChild(valueCell);

        // Destaca a área de código e dados
        if (i < CODE_MEMORY_LIMIT) {
            row.style.backgroundColor = "#e0f7fa"; // Área de código
        } else if (i >= DATA_MEMORY_START) {
            row.style.backgroundColor = "#f1f8e9"; // Área de dados
        }

        // Destaque da instrução atual
        if (i === IP) {
            row.classList.add("current-instruction");
        }

        memoryTableBody.appendChild(row);
    }
}

// Função para registrar mensagens no console de log
function logMessage(message) {
    const logConsole = document.getElementById("logConsole");
    const messagePara = document.createElement("p");
    messagePara.innerText = message;
    logConsole.appendChild(messagePara);
    logConsole.scrollTop = logConsole.scrollHeight; // Rola para o final
}

// Sobrescreve a função console.log para registrar no console de log
(function() {
    const originalLog = console.log;
    console.log = function(message) {
        originalLog.apply(console, arguments);
        logMessage(message);
    };
})();

// Atualiza o display do teclado após cada operação
function updateDisplay() {
    document.getElementById("display").innerText = inputValue || "0";
}

// Modifica as funções de entrada para atualizar o display e barramentos
function pressKey(value) {
    inputValue += value;
    updateDisplay();
}

function clearDisplay() {
    inputValue = "";
    updateDisplay();
}

function sendToDataBus() {
    if (inputValue) {
        dataBus = parseInt(inputValue, 10); // Converte valor para número
        controlBus.io = true;               // Ativa I/O
        console.log("Valor enviado para o dataBus:", dataBus);
        inputValue = "";
        updateDisplay();
        updateBusesView();

        // Sinaliza a interrupção IRQ1
        window.IRQ1 = true;
    }
}

// Modifica a função updateDisplayFromDataBus para atualizar os barramentos
function updateDisplayFromDataBus() {
    document.getElementById("display").innerText = dataBus;
    updateBusesView();
}

// Atualiza a função executeProgram para registrar logs e atualizar visualizações
function executeProgram() {
    while (IP < CODE_MEMORY_LIMIT && memory[IP] !== 0) {
        executeNextInstruction();
        if (stepMode) {
            break; // Sai após executar uma instrução no modo passo a passo
        }
    }
    updateRegistersView();
    updateMemoryView();
}

// Chama a atualização dos barramentos ao executar instruções que envolvem I/O
const originalExecuteInstruction = executeInstruction;
executeInstruction = function(instruction, operand) {
    originalExecuteInstruction.apply(this, arguments);
    updateRegistersView();
    updateBusesView();
    highlightActiveElements(instruction);
};

// Função para destacar elementos ativos durante a execução
function highlightActiveElements(instruction) {
    // Limpa destaques anteriores
    document.querySelectorAll(".highlight").forEach(el => el.classList.remove("highlight"));

    // Destaca registradores e barramentos usados
    if (['LOAD', 'ADD', 'SUB', 'STORE', 'INC', 'DEC'].includes(instruction)) {
        document.getElementById("regA").parentElement.classList.add("highlight");
    }

    if (['IN', 'OUT'].includes(instruction)) {
        document.getElementById("dataBus").parentElement.classList.add("highlight");
    }

    // Atualiza a visualização da memória para destacar a instrução atual
    updateMemoryView();
}
