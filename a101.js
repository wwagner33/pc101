// Arquivo: a101.js

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

// Expondo os OpCodes para outros módulos
export const OPCODES = {
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

// Definição dos limites de memória
export const CODE_MEMORY_LIMIT = 70; // Limite para a memória de código
export const DATA_MEMORY_START = 70; // Início da memória de dados
export const MEMORY_SIZE = 100;      // Tamanho total da memória

// Mapeamento dos códigos dos registradores
const REGISTER_CODES = {
    'A': -1,
    'B': -2,
    'C': -3
};

// Função para remover comentários do código A101
export function removeComments(program) {
    // Remove comentários delimitados por /* e */
    program = program.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove comentários de linha únicos iniciados por // ou \
    program = program.replace(/\/\/.*$/gm, '');
    program = program.replace(/\\.*$/gm, '');
    return program;
}

// Função para montar o código A101 e retornar o código de máquina
export function assemble(program) {
    const cleanedProgram = removeComments(program);

    const lines = cleanedProgram.split('\n');
    let codeAddress = 0;
    let dataAddress = DATA_MEMORY_START;
    let hasError = false;
    let errorMessages = [];
    const labels = {};       // Labels de código
    const dataLabels = {};   // Labels de dados
    const machineCode = Array(MEMORY_SIZE).fill(0);

    // Mapa de OpCodes
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

    // Instruções que requerem operandos
    const instructionsWithOperands = [OPCODE_LOAD, OPCODE_ADD, OPCODE_SUB, OPCODE_STORE, OPCODE_JMP, OPCODE_JZ, OPCODE_INC, OPCODE_DEC];

    // Primeira Passagem: Construir tabelas de símbolos
    for (let index = 0; index < lines.length; index++) {
        let line = lines[index];
        const lineNumber = index + 1;

        // Remove espaços extras e ignora linhas vazias
        let cleanLine = line.trim();
        if (cleanLine === '') continue;

        // Ignora comentários em linha
        cleanLine = cleanLine.split(';')[0].trim();
        if (cleanLine === '') continue;

        // Verifica se a linha contém um label
        if (cleanLine.includes(':')) {
            const [labelPart, rest] = cleanLine.split(':');
            const label = labelPart.trim();
            const instructionLine = rest ? rest.trim() : '';

            // Verifica duplicação de labels
            if (labels.hasOwnProperty(label) || dataLabels.hasOwnProperty(label)) {
                hasError = true;
                errorMessages.push(`Erro na linha ${lineNumber}: Label duplicado "${label}".`);
                continue;
            }

            // Determina se é label de código ou de dados
            const firstToken = instructionLine.split(/\s+/)[0].toUpperCase();

            if (opcodeMap.hasOwnProperty(firstToken) || instructionLine === '') {
                // Label de código
                labels[label] = codeAddress;
            } else if (!isNaN(parseInt(firstToken, 10))) {
                // Label de dados
                dataLabels[label] = dataAddress;
                dataAddress++;
            } else {
                // Pode ser label de dados com valor simbólico
                dataLabels[label] = dataAddress;
                dataAddress++;
            }

            cleanLine = instructionLine;
            if (cleanLine === '') continue;
        }

        // Verifica se a linha é uma instrução
        const tokens = cleanLine.split(/\s+/);
        const instruction = tokens[0].toUpperCase();

        if (opcodeMap.hasOwnProperty(instruction)) {
            const opcode = opcodeMap[instruction];
            // Incrementa o codeAddress
            if (instructionsWithOperands.includes(opcode)) {
                codeAddress += 2;
            } else {
                codeAddress += 1;
            }

            if (codeAddress >= CODE_MEMORY_LIMIT) {
                hasError = true;
                errorMessages.push('Erro: Estouro de Memória de Código.');
                break;
            }
        } else if (!isNaN(parseInt(instruction, 10))) {
            // Linha com valor numérico sem label
            hasError = true;
            errorMessages.push(`Erro na linha ${lineNumber}: Valor de dados sem label.`);
        } else {
            hasError = true;
            errorMessages.push(`Erro na linha ${lineNumber}: Instrução desconhecida ou label inválida "${instruction}".`);
        }
    }

    // Segunda Passagem: Montagem do código de máquina
    if (!hasError) {
        codeAddress = 0;

        for (let index = 0; index < lines.length; index++) {
            let line = lines[index];
            const lineNumber = index + 1;

            // Remove espaços extras e ignora linhas vazias
            let cleanLine = line.trim();
            if (cleanLine === '') continue;

            // Ignora comentários em linha
            cleanLine = cleanLine.split(';')[0].trim();
            if (cleanLine === '') continue;

            // Verifica se a linha contém um label
            if (cleanLine.includes(':')) {
                const [labelPart, rest] = cleanLine.split(':');
                const label = labelPart.trim();
                const instructionLine = rest ? rest.trim() : '';

                cleanLine = instructionLine;
                if (cleanLine === '') {
                    // Pode ser um label de dados sem valor explícito
                    continue;
                }
            }

            // Verifica se a linha é uma instrução
            const tokens = cleanLine.split(/\s+/);
            const instruction = tokens[0].toUpperCase();

            if (opcodeMap.hasOwnProperty(instruction)) {
                const opcode = opcodeMap[instruction];
                machineCode[codeAddress] = opcode;

                if (instructionsWithOperands.includes(opcode)) {
                    if (tokens.length < 2) {
                        hasError = true;
                        errorMessages.push(`Erro na linha ${lineNumber}: Operando ausente para a instrução "${instruction}".`);
                        break;
                    }

                    let operand = tokens[1];
                    let operandValue;

                    // Verifica se o operando é um registrador
                    if (REGISTER_CODES.hasOwnProperty(operand.toUpperCase())) {
                        operandValue = REGISTER_CODES[operand.toUpperCase()];
                    } else if (!isNaN(parseInt(operand, 10))) {
                        operandValue = parseInt(operand, 10);
                    } else if (labels.hasOwnProperty(operand)) {
                        operandValue = labels[operand];
                    } else if (dataLabels.hasOwnProperty(operand)) {
                        operandValue = dataLabels[operand];
                    } else {
                        hasError = true;
                        errorMessages.push(`Erro na linha ${lineNumber}: Operando desconhecido "${operand}".`);
                        break;
                    }

                    machineCode[codeAddress + 1] = operandValue;
                    codeAddress += 2;
                } else {
                    // Instruções sem operandos
                    codeAddress += 1;
                }
            } else if (dataLabels.hasOwnProperty(instruction)) {
                // Linha é um label de dados com valor
                let valueToken = tokens[1];
                let value = 0;

                if (valueToken !== undefined) {
                    if (!isNaN(parseInt(valueToken, 10))) {
                        value = parseInt(valueToken, 10);
                    } else {
                        hasError = true;
                        errorMessages.push(`Erro na linha ${lineNumber}: Valor inválido para o dado "${instruction}".`);
                        break;
                    }
                }

                const address = dataLabels[instruction];
                machineCode[address] = value;
            } else {
                hasError = true;
                errorMessages.push(`Erro na linha ${lineNumber}: Instrução desconhecida ou label inválida "${instruction}".`);
                break;
            }
        }
    }

    if (hasError) {
        return { success: false, errors: errorMessages };
    } else {
        console.log('Montagem concluída com sucesso.');
        return { success: true, machineCode: machineCode };
    }
}