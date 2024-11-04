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

// Definição dos OpCodes como constantes numéricas
const OPCODE_LOAD = parseInt("0001", 2); // 1
const OPCODE_ADD = parseInt("0010", 2); // 2
const OPCODE_SUB = parseInt("0011", 2); // 3
const OPCODE_STORE = parseInt("0100", 2); // 4
const OPCODE_JMP = parseInt("0101", 2); // 5
const OPCODE_JZ = parseInt("0110", 2); // 6
const OPCODE_IN = parseInt("0111", 2); // 7
const OPCODE_OUT = parseInt("1000", 2); // 8
const OPCODE_INC = parseInt("1001", 2); // 9
const OPCODE_DEC = parseInt("1010", 2); // 10

// Mapeamento dos códigos dos registradores
const REGISTER_CODES = {
    'A': -1,
    'B': -2,
    'C': -3
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

    // Primeira passagem: Identificar labels e variáveis, e verificar tamanho do código
    for (let index = 0; index < lines.length; index++) {
        let line = lines[index];
        const lineNumber = index + 1;

        // Remove espaços extras
        let cleanLine = line.trim();

        // Ignora linhas vazias
        if (cleanLine === "") continue;

        // Verifica se a linha contém um label
        if (cleanLine.includes(':')) {
            const [label, rest] = cleanLine.split(':');
            const labelName = label.trim();
            const instructionLine = rest.trim();

            if (instructionLine === "") {
                // Label sem instrução na mesma linha
                // Assumimos que labels sem instruções são variáveis
                labels[labelName] = dataAddress;
                dataAddress++;

                // Verifica se a memória de dados excede o limite
                if (dataAddress >= memory.length) {
                    hasError = true;
                    errorMessages.push("Erro: Estouro de Memória de Dados. Não há espaço suficiente para armazenar os dados.");
                    break;
                }

                continue; // Processa a próxima linha
            } else {
                // Label com instrução na mesma linha
                labels[labelName] = address; // Marca o endereço atual para o label
                cleanLine = instructionLine; // Processa a instrução após o label
            }
        }

        // Verifica se é uma declaração de variável
        if (cleanLine.includes(';')) {
            // Remove o ";" do final da instrução
            cleanLine = cleanLine.slice(0, -1).trim();
        }

        // Ignora linhas que ficaram vazias após o processamento
        if (cleanLine === "") continue;

        // Calcula o tamanho da instrução
        const instructionSize = processInstruction(cleanLine, address, lineNumber, true);
        address += instructionSize;

        // Verifica se o código excede o limite de memória
        if (address > CODE_MEMORY_LIMIT) {
            hasError = true;
            errorMessages.push("Erro: Estouro de Memória de Código. O programa excede o limite de memória disponível.");
            break;
        }
    }

    // Segunda passagem: Montar o código e resolver labels
    if (!hasError) {
        address = 0; // Reinicia o endereço para montar o código
        dataAddress = DATA_MEMORY_START; // Reinicia o endereço de dados para inicialização

        for (let index = 0; index < lines.length; index++) {
            let line = lines[index];
            const lineNumber = index + 1;

            // Remove espaços extras
            let cleanLine = line.trim();

            // Ignora linhas vazias
            if (cleanLine === "") continue;

            // Verifica se a linha contém um label
            if (cleanLine.includes(':')) {
                const [label, rest] = cleanLine.split(':');
                const labelName = label.trim();
                const instructionLine = rest.trim();

                if (instructionLine === "") {
                    // Variável sem valor inicial (já tratada na primeira passagem)
                    continue;
                } else if (!isNaN(parseInt(instructionLine, 10))) {
                    // Variável com valor inicial
                    let value = parseInt(instructionLine, 10);
                    memory[labels[labelName]] = value;
                    continue;
                } else {
                    // Label de código com instrução na mesma linha
                    cleanLine = instructionLine;
                }
            }

            // Verifica se é uma declaração de variável
            if (cleanLine.includes(';')) {
                // Remove o ";" do final da instrução
                cleanLine = cleanLine.slice(0, -1).trim();
            }

            // Ignora linhas que ficaram vazias após o processamento
            if (cleanLine === "") continue;

            const instructionSize = processInstruction(cleanLine, address, lineNumber, false, labels, unresolvedJumps, errorMessages);
            address += instructionSize;
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
    let tokens = instructionLine.split(/[\s,]+/);
    let instruction = tokens[0];
    let operands = tokens.slice(1);

    // Mapeia a instrução para o opcode numérico
    const opcodeMap = {
        'LOAD': OPCODE_LOAD,
        'ADD': OPCODE_ADD,
        'SUB': OPCODE_SUB,
        'STORE': OPCODE_STORE,
        'JMP': OPCODE_JMP,
        'JZ': OPCODE_JZ,
        'IN': OPCODE_IN,
        'OUT': OPCODE_OUT,
        'INC': OPCODE_INC,
        'DEC': OPCODE_DEC,
    };

    const opcode = opcodeMap[instruction];

    if (opcode !== undefined) {
        // Verifica se a instrução requer operandos e se eles estão presentes
        const instructionsWithOperands = [OPCODE_LOAD, OPCODE_ADD, OPCODE_SUB, OPCODE_STORE, OPCODE_JMP, OPCODE_JZ, OPCODE_INC, OPCODE_DEC];
        if (instructionsWithOperands.includes(opcode) && operands.length === 0) {
            if (!firstPass) {
                errorMessages.push(`Erro na linha ${lineNumber}: Operando ausente para a instrução "${instruction}".`);
            }
            return 0;
        }

        if (!firstPass) {
            // Armazena o opcode numérico na memória
            memory[address] = opcode;

            // Tratamento de operandos
            if (operands.length > 0) {
                let operandValue = null;

                // Verifica se o operando é um registrador, um número ou um label
                let operand = operands[0];

                // Operações com registradores
                if (['A', 'B', 'C'].includes(operand)) {
                    operandValue = REGISTER_CODES[operand]; // Armazenamos o código do registrador
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
        Estouro de Memória de Código durante a execução.
        if (instruction.endsWith(':')) {
            // Variável sem valor inicial
            let varName = instruction.slice(0, -1);
            if (firstPass) {
                labels[varName] = dataAddress;
                dataAddress++;

                // Verifica se a memória de dados excede o limite
                if (dataAddress >= memory.length) {
                    hasError = true;
                    errorMessages.push("Erro: Estouro de Memória de Dados. Não há espaço suficiente para armazenar os dados.");
                }
            }
            return 0;
        } else if (!isNaN(parseInt(operands[0], 10))) {
            // Variável com valor inicial
            let varName = instruction;
            if (firstPass) {
                labels[varName] = dataAddress;
                dataAddress++;

                // Verifica se a memória de dados excede o limite
                if (dataAddress >= memory.length) {
                    hasError = true;
                    errorMessages.push("Erro: Estouro de Memória de Dados. Não há espaço suficiente para armazenar os dados.");
                }
            } else {
                let value = parseInt(operands[0], 10);
                memory[labels[varName]] = value;
            }
            return 0;
        } else {
            if (!firstPass) {
                errorMessages.push(`Erro na montagem na linha ${lineNumber}: Instrução ou declaração inválida "${instructionLine}".`);
            }
            return 0;
        }
    }
}

// Função para executar o programa carregado na memória
function executeProgram() {
    IP = 0; // Reseta o Instruction Pointer
    while (IP < CODE_MEMORY_LIMIT && memory[IP] !== 0) {
        const opcode = memory[IP];
        const operand = memory[IP + 1];

        executeOpcode(opcode, operand);

        // Ajusta o IP com base na instrução
        if ([OPCODE_LOAD, OPCODE_ADD, OPCODE_SUB, OPCODE_STORE, OPCODE_INC, OPCODE_DEC].includes(opcode)) {
            IP += 2;
        } else if (opcode === OPCODE_JMP || opcode === OPCODE_JZ) {
            // O IP já foi ajustado dentro da instrução
        } else if (opcode === OPCODE_IN || opcode === OPCODE_OUT) {
            IP += 1;
        } else {
            IP += 1;
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

// Função para executar a instrução baseada no opcode
function executeOpcode(opcode, operand) {
    let operandValue;

    // Tratamento dos operandos registradores
    if (operand === REGISTER_CODES['A']) {
        operandValue = getRegisterValue('A');
    } else if (operand === REGISTER_CODES['B']) {
        operandValue = getRegisterValue('B');
    } else if (operand === REGISTER_CODES['C']) {
        operandValue = getRegisterValue('C');
    } else {
        operandValue = operand;
        // Se o operando for um endereço de memória, pega o valor da memória
        if (operand >= 0 && operand < memory.length) {
            operandValue = memory[operand];
        }
    }

    switch (opcode) {
        case OPCODE_LOAD:
            A = operandValue;
            console.log(`LOAD: A = ${A}`);
            break;

        case OPCODE_ADD:
            A += operandValue;
            console.log(`ADD: A = ${A}`);
            break;

        case OPCODE_SUB:
            A -= operandValue;
            console.log(`SUB: A = ${A}`);
            break;

        case OPCODE_STORE:
            if (operand === REGISTER_CODES['A'] || operand === REGISTER_CODES['B'] || operand === REGISTER_CODES['C']) {
                if (operand === REGISTER_CODES['A']) {
                    setRegisterValue('A', A);
                } else if (operand === REGISTER_CODES['B']) {
                    setRegisterValue('B', A);
                } else if (operand === REGISTER_CODES['C']) {
                    setRegisterValue('C', A);
                }
            } else {
                // Armazena em memória
                if (operand >= 0 && operand < memory.length) {
                    memory[operand] = A;
                } else {
                    console.error(`Erro: Endereço inválido ${operand} na instrução STORE.`);
                    IP = memory.length; // Termina a execução
                }
            }
            console.log(`STORE: A armazenado em ${operand}`);
            break;

        case OPCODE_JMP:
            if (operand !== null) {
                IP = operand;
                console.log(`JMP para: ${IP}`);
            }
            break;

        case OPCODE_JZ:
            if (A === 0 && operand !== null) {
                IP = operand;
                console.log(`JZ para: ${IP}`);
            } else {
                IP += 2; // Avança para a próxima instrução se A não for zero
            }
            break;

        case OPCODE_IN:
            // A função de entrada será gerenciada pelo interface.js
            A = dataBus;
            console.log(`IN: A = ${A}`);
            break;

        case OPCODE_OUT:
            // Modificação para implementar IRQ2
            dataBus = A;
            window.IRQ2 = true; // Sinaliza a interrupção IRQ2
            console.log(`OUT: A = ${A}`);
            break;

        case OPCODE_INC:
            if (operand === REGISTER_CODES['A'] || operand === REGISTER_CODES['B'] || operand === REGISTER_CODES['C']) {
                let regName = operand === REGISTER_CODES['A'] ? 'A' : operand === REGISTER_CODES['B'] ? 'B' : 'C';
                let value = getRegisterValue(regName);
                setRegisterValue(regName, value + 1);
                console.log(`INC: ${regName} = ${value + 1}`);
            } else {
                console.error(`Erro: Operando inválido para INC: ${operand}`);
            }
            break;

        case OPCODE_DEC:
            if (operand === REGISTER_CODES['A'] || operand === REGISTER_CODES['B'] || operand === REGISTER_CODES['C']) {
                let regName = operand === REGISTER_CODES['A'] ? 'A' : operand === REGISTER_CODES['B'] ? 'B' : 'C';
                let value = getRegisterValue(regName);
                setRegisterValue(regName, value - 1);
                console.log(`DEC: ${regName} = ${value - 1}`);
            } else {
                console.error(`Erro: Operando inválido para DEC: ${operand}`);
            }
            break;

        default:
            console.error(`Erro na execução: Opcode desconhecido ${opcode}`);
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
window.executeOpcode = executeOpcode; // Exporta a função executeOpcode

// Expondo os OpCodes para interface.js
window.OPCODES = {
    LOAD: OPCODE_LOAD,
    ADD: OPCODE_ADD,
    SUB: OPCODE_SUB,
    STORE: OPCODE_STORE,
    JMP: OPCODE_JMP,
    JZ: OPCODE_JZ,
    IN: OPCODE_IN,
    OUT: OPCODE_OUT,
    INC: OPCODE_INC,
    DEC: OPCODE_DEC
};