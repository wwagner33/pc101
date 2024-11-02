// Arquivo: pc101.js

// Memória principal (100 posições de 8 bits)
const memory = Array(100).fill(0);

// Definição dos limites de memória
const CODE_MEMORY_LIMIT = 70; // Limite para a memória de código (0 a 69)
const DATA_MEMORY_START = 70; // Início da memória de dados (70 a 99)

// Registradores
let A = 0; // Acumulador
let B = 0; // Registrador B
let C = 0; // Registrador C
let IP = 0; // Instruction Pointer

// Barramento de Dados
let dataBus = 0; // Dado sendo transferido

// Barramento de Controle
let controlBus = {
    read: false, // Habilita leitura
    write: false, // Habilita escrita
    io: false, // Habilita acesso I/O
};

// Sinais de Interrupção
window.IRQ1 = false; // Interrupção do teclado
window.IRQ2 = false; // Interrupção do display

// Tabela de OpCodes em binário para o conjunto de instruções
const opCodes = {
    'LOAD': "0001",
    'ADD': "0010",
    'SUB': "0011",
    'STORE': "0100",
    'JMP': "0101",
    'JZ': "0110",
    'IN': "0111",
    'OUT': "1000",
    'INC': "1001",
    'DEC': "1010",
};

// Função para remover comentários do código A101
function removeComments(program) {
    // Remove comentários delimitados por /* e */
    program = program.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove comentários de linha únicos iniciados por // ou \
    program = program.replace(/\/\/.*$/gm, '');
    program = program.replace(/\\.*$/gm, '');
    return program;
}

// Função para montar o código A101 e carregar na memória
function assembleAndLoad(program) {
    // Remove comentários do código
    const cleanedProgram = removeComments(program);

    const lines = cleanedProgram.split('\n');
    let address = 0;
    let hasError = false; // Flag para indicar se houve erros durante a montagem
    let errorMessages = []; // Array para armazenar mensagens de erro
    const labels = {}; // Dicionário de labels
    const unresolvedJumps = []; // Lista de saltos a resolver
    let dataAddress = DATA_MEMORY_START; // Ponteiro para alocação de dados

    // Limpa a memória antes de carregar um novo programa
    memory.fill(0);

    // Primeira passagem: Identificar labels e verificar tamanho do código
    for (let index = 0; index < lines.length; index++) {
        let line = lines[index];
        const lineNumber = index + 1;

        // Remove espaços extras
        let cleanLine = line.trim();

        // Ignora linhas vazias
        if (cleanLine === "") continue;

        // Verifica se a linha termina com ";"
        if (!cleanLine.endsWith(';')) {
            hasError = true;
            errorMessages.push(`Erro de sintaxe na linha ${lineNumber}: ";" esperado no final da instrução.`);
            continue;
        }

        // Remove o ";" do final da instrução
        cleanLine = cleanLine.slice(0, -1).trim();

        // Verifica se a linha contém um label
        if (cleanLine.includes(':')) {
            const [label, rest] = cleanLine.split(':');
            const labelName = label.trim();
            const instructionLine = rest.trim();

            if (instructionLine === "") {
                // Definição de dado sem valor inicial (assume 0)
                labels[labelName] = dataAddress;
                dataAddress++; // Incrementa o endereço de dados

                // Verifica se a memória de dados excede o limite
                if (dataAddress >= memory.length) {
                    hasError = true;
                    errorMessages.push("Erro: Estouro de Memória de Dados. Não há espaço suficiente para armazenar os dados.");
                    break;
                }
            } else if (!isNaN(parseInt(instructionLine, 10))) {
                // Definição de dado com valor inicial
                labels[labelName] = dataAddress;
                memory[dataAddress] = parseInt(instructionLine, 10);
                dataAddress++; // Incrementa o endereço de dados

                // Verifica se a memória de dados excede o limite
                if (dataAddress >= memory.length) {
                    hasError = true;
                    errorMessages.push("Erro: Estouro de Memória de Dados. Não há espaço suficiente para armazenar os dados.");
                    break;
                }
            } else {
                // Label de código
                labels[labelName] = address;
                address += processInstruction(instructionLine, address, lineNumber, true);

                // Verifica se o código excede o limite de memória
                if (address > CODE_MEMORY_LIMIT) {
                    hasError = true;
                    errorMessages.push("Erro: Estouro de Memória de Código. O programa excede o limite de memória disponível.");
                    break;
                }
            }
        } else {
            address += processInstruction(cleanLine, address, lineNumber, true);

            // Verifica se o código excede o limite de memória
            if (address > CODE_MEMORY_LIMIT) {
                hasError = true;
                errorMessages.push("Erro: Estouro de Memória de Código. O programa excede o limite de memória disponível.");
                break;
            }
        }
    }

    // Segunda passagem: Montar o código e resolver labels
    if (!hasError) {
        address = 0; // Reinicia o endereço para montar o código
        for (let index = 0; index < lines.length; index++) {
            let line = lines[index];
            const lineNumber = index + 1;

            // Remove espaços extras
            let cleanLine = line.trim();

            // Ignora linhas vazias
            if (cleanLine === "") continue;

            // Remove o ";" do final da instrução
            cleanLine = cleanLine.slice(0, -1).trim();

            // Verifica se a linha contém um label
            if (cleanLine.includes(':')) {
                const [label, rest] = cleanLine.split(':');
                const labelName = label.trim();
                const instructionLine = rest.trim();

                if (instructionLine === "") {
                    // Definição de dado sem valor inicial (já inicializado na primeira passagem)
                } else if (!isNaN(parseInt(instructionLine, 10))) {
                    // Definição de dado com valor inicial (já inicializado na primeira passagem)
                } else {
                    // Label de código
                    address += processInstruction(instructionLine, address, lineNumber, false, labels, unresolvedJumps, errorMessages);
                }
            } else {
                address += processInstruction(cleanLine, address, lineNumber, false, labels, unresolvedJumps, errorMessages);
            }
        }

        // Resolver os saltos que estavam pendentes
        unresolvedJumps.forEach(jump => {
            const { address, operandLabel, lineNumber } = jump;
            if (labels.hasOwnProperty(operandLabel)) {
                memory[address + 1] = labels[operandLabel];
            } else {
                hasError = true;
                errorMessages.push(`Erro na linha ${lineNumber}: Label desconhecido "${operandLabel}".`);
            }
        });
    }

    if (hasError) {
        // Exibe as mensagens de erro e não prossegue com a execução
        errorMessages.forEach(msg => console.error(msg));
        return false; // Indica que a montagem falhou
    } else {
        console.log("Programa carregado na memória:", memory.slice(0, address));
        console.log("Montagem concluída com sucesso.");
        return true; // Montagem bem-sucedida
    }
}

// Função auxiliar para processar instruções
function processInstruction(instructionLine, address, lineNumber, firstPass, labels = {}, unresolvedJumps = [], errorMessages = []) {
    let tokens = instructionLine.split(/[\s,]+/); // Divide por espaços e vírgulas
    let instruction = tokens[0];
    let operands = tokens.slice(1);

    const opcode = opCodes[instruction];

    if (opcode !== undefined) {
        // Verifica se a instrução requer operandos e se eles estão presentes
        const instructionsWithOperands = ['LOAD', 'ADD', 'SUB', 'STORE', 'JMP', 'JZ', 'INC', 'DEC'];
        if (instructionsWithOperands.includes(instruction) && operands.length === 0) {
            if (!firstPass) {
                errorMessages.push(`Erro na linha ${lineNumber}: Operando ausente para a instrução "${instruction}".`);
            }
            return 0;
        }

        if (!firstPass) {
            // Converte o opcode para número e armazena na memória
            memory[address] = parseInt(opcode, 2);

            // Tratamento de operandos
            if (operands.length > 0) {
                let operandValue = null;

                // Verifica se o operando é um registrador, um número ou um label
                let operand = operands[0];

                // Operações com registradores
                if (['A', 'B', 'C'].includes(operand)) {
                    operandValue = operand; // Armazenamos o nome do registrador
                } else {
                    // Pode ser um valor imediato ou um label
                    operandValue = parseInt(operand, 10);
                    if (isNaN(operandValue)) {
                        // Pode ser um label
                        if (labels.hasOwnProperty(operand)) {
                            operandValue = labels[operand];
                        } else {
                            // Adiciona à lista de saltos a resolver
                            unresolvedJumps.push({
                                address: address,
                                operandLabel: operand,
                                lineNumber: lineNumber
                            });
                            operandValue = 0; // Valor temporário
                        }
                    }
                }

                // Armazena o operando na próxima posição
                memory[address + 1] = operandValue;
            }
        }

        return operands.length > 0 ? 2 : 1; // Retorna o tamanho da instrução
    } else {
        if (!firstPass) {
            errorMessages.push(`Erro na montagem na linha ${lineNumber}: Instrução inválida "${instruction}".`);
        }
        return 0;
    }
}

// Implementação do conjunto básico de instruções
function executeInstruction(instruction, operand = null) {
    switch (instruction) {
        case 'LOAD':
            if (typeof operand === 'string') {
                // Carregar valor de um registrador
                A = getRegisterValue(operand);
            } else if (typeof operand === 'number') {
                // Carregar valor imediato
                A = operand;
            }
            console.log(`LOAD: A = ${A}`);
            break;

        case 'ADD':
            if (typeof operand === 'string') {
                A += getRegisterValue(operand);
            } else if (typeof operand === 'number') {
                A += operand;
            }
            console.log(`ADD: A = ${A}`);
            break;

        case 'SUB':
            if (typeof operand === 'string') {
                A -= getRegisterValue(operand);
            } else if (typeof operand === 'number') {
                A -= operand;
            }
            console.log(`SUB: A = ${A}`);
            break;

        case 'STORE':
            if (typeof operand === 'string') {
                // Armazenar em um registrador
                setRegisterValue(operand, A);
            } else if (typeof operand === 'number') {
                // Armazenar em memória
                if (operand >= DATA_MEMORY_START && operand < memory.length) {
                    memory[operand] = A;
                } else {
                    console.error(`Erro: Endereço inválido ${operand} na instrução STORE.`);
                    IP = memory.length; // Termina a execução
                }
            }
            console.log(`STORE: A armazenado em ${operand}`);
            break;

        case 'INC':
            if (typeof operand === 'string') {
                let value = getRegisterValue(operand);
                setRegisterValue(operand, value + 1);
                console.log(`INC: ${operand} = ${value + 1}`);
            } else {
                console.error(`Erro: Operando inválido para INC: ${operand}`);
            }
            break;

        case 'DEC':
            if (typeof operand === 'string') {
                let value = getRegisterValue(operand);
                setRegisterValue(operand, value - 1);
                console.log(`DEC: ${operand} = ${value - 1}`);
            } else {
                console.error(`Erro: Operando inválido para DEC: ${operand}`);
            }
            break;

        case 'JMP':
            if (operand !== null) {
                IP = operand;
                console.log(`JMP para: ${IP}`);
            }
            break;

        case 'JZ':
            if (A === 0 && operand !== null) {
                IP = operand;
                console.log(`JZ para: ${IP}`);
            } else {
                IP += 2; // Avança para a próxima instrução se A não for zero
            }
            break;

        case 'IN':
            // A função de entrada será gerenciada pelo interface.js
            A = dataBus;
            console.log(`IN: A = ${A}`);
            break;

        case 'OUT':
            // Modificação para implementar IRQ2
            dataBus = A;
            window.IRQ2 = true; // Sinaliza a interrupção IRQ2
            console.log(`OUT: A = ${A}`);
            break;

        default:
            console.error(`Instrução inválida: ${instruction}`);
            break;
    }
}

// Funções auxiliares para acessar registradores
function getRegisterValue(register) {
    switch (register) {
        case 'A':
            return A;
        case 'B':
            return B;
        case 'C':
            return C;
        default:
            console.error(`Registrador desconhecido: ${register}`);
            return 0;
    }
}

function setRegisterValue(register, value) {
    switch (register) {
        case 'A':
            A = value;
            break;
        case 'B':
            B = value;
            break;
        case 'C':
            C = value;
            break;
        default:
            console.error(`Registrador desconhecido: ${register}`);
            break;
    }
}

// Função para executar o programa carregado na memória
function executeProgram() {
    IP = 0; // Reseta o Instruction Pointer
    while (IP < CODE_MEMORY_LIMIT && memory[IP] !== 0) {
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
            console.error(`Erro na execução: Instrução desconhecida no endereço ${IP}, valor: ${opcode}`);
            break;
        }

        // Verifica se o IP excedeu o limite de memória de código
        if (IP >= CODE_MEMORY_LIMIT) {
            console.error("Erro: Estouro de Memória de Código durante a execução.");
            break;
        }

        // Checagem de interrupções após cada instrução
        // As interrupções serão tratadas no interface.js
    }
    console.log("Execução completa.");
}

// Expondo as funções e variáveis necessárias para o interface.js
window.memory = memory;
window.A = A;
window.B = B;
window.C = C;
window.IP = IP;
window.dataBus = dataBus;
window.controlBus = controlBus;
window.CODE_MEMORY_LIMIT = CODE_MEMORY_LIMIT;
window.DATA_MEMORY_START = DATA_MEMORY_START;

window.assembleAndLoad = assembleAndLoad;
window.executeProgram = executeProgram;
window.executeInstruction = executeInstruction;
window.opCodes = opCodes;
