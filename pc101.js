// Arquivo: pc101.js

// Importação dos OpCodes do montador
import { OPCODES } from './a101.js';

// Memória principal (100 posições de 8 bits)
export const memory = Array(100).fill(0);

// Definição dos limites de memória
export const CODE_MEMORY_LIMIT = 70; // Limite para a memória de código (0 a 69)
export const DATA_MEMORY_START = 70; // Início da memória de dados (70 a 99)

// Registradores (variáveis internas)
let A = 0; // Acumulador
let B = 0; // Registrador B
let C = 0; // Registrador C
let IP = 0; // Instruction Pointer

// Barramento de Dados
let dataBus = 0; // Dado sendo transferido

// Barramento de Controle
const controlBus = {
    read: false, // Habilita leitura
    write: false, // Habilita escrita
    io: false,    // Habilita acesso I/O
};

// Sinais de Interrupção
let IRQ1 = false; // Interrupção do teclado
let IRQ2 = false; // Interrupção do display

// Variável para armazenar o opcode atual (para a interface gráfica)
let currentOpcode = null;

// Mapeamento dos códigos dos registradores
const REGISTER_CODES = {
    'A': -1,
    'B': -2,
    'C': -3,
};

// Funções de Callback para Logs e Atualização de Display
let logCallback = null;
let updateDisplayCallback = null;

// Função para definir o callback de log
export function setLogCallback(callback) {
    logCallback = callback;
}

// Função para definir o callback de atualização do display
export function setUpdateDisplayCallback(callback) {
    updateDisplayCallback = callback;
}

// Função auxiliar para log
function log(message) {
    if (logCallback) {
        logCallback(message);
    } else {
        console.log(message);
    }
}

// Função para carregar o código de máquina na memória
export function loadMachineCode(machineCode) {
    // Limpa a memória antes de carregar um novo programa
    memory.fill(0);
    // Carrega o código de máquina na memória
    for (let i = 0; i < machineCode.length; i++) {
        memory[i] = machineCode[i];
    }
    log('Programa carregado na memória.');
}

// Função para executar o programa carregado na memória
export function executeProgram() {
    IP = 0; // Reseta o Instruction Pointer
    while (IP < CODE_MEMORY_LIMIT && memory[IP] !== 0) {
        const opcode = memory[IP];
        const operand = memory[IP + 1];

        executeOpcode(opcode, operand);

        // Checagem de interrupções após cada instrução
        checkInterrupts();

        // Verifica se o IP excedeu o limite de memória de código
        if (IP >= CODE_MEMORY_LIMIT) {
            log('Erro: Estouro de Memória de Código durante a execução.');
            break;
        }
    }
    log('Execução completa.');
}

// Função para executar a próxima instrução (para modo passo a passo)
export function executeNextInstruction() {
    const opcode = memory[IP];
    const operand = memory[IP + 1];

    if (opcode !== undefined) {
        executeOpcode(opcode, operand);

        // Checagem de interrupções
        checkInterrupts();

        // Verifica se o IP excedeu o limite de memória de código
        if (IP >= CODE_MEMORY_LIMIT) {
            log('Erro: Estouro de Memória de Código durante a execução.');
        }
    } else {
        log(`Erro na execução: Opcode desconhecido no endereço ${IP}.`);
    }
}

// Função para executar a instrução baseada no opcode
export function executeOpcode(opcode, operand) {
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
        case OPCODES.LOAD:
            A = operandValue;
            log(`LOAD: A = ${A}`);
            IP += 2;
            break;

        case OPCODES.ADD:
            A += operandValue;
            log(`ADD: A = ${A}`);
            IP += 2;
            break;

        case OPCODES.SUB:
            A -= operandValue;
            log(`SUB: A = ${A}`);
            IP += 2;
            break;

        case OPCODES.STORE:
            if ([REGISTER_CODES['A'], REGISTER_CODES['B'], REGISTER_CODES['C']].includes(operand)) {
                setRegisterValue(getRegisterNameByCode(operand), A);
            } else if (operand >= 0 && operand < memory.length) {
                memory[operand] = A;
            } else {
                log(`Erro: Endereço inválido ${operand} na instrução STORE.`);
                IP = memory.length; // Termina a execução
            }
            log(`STORE: A armazenado em ${operand}`);
            IP += 2;
            break;

        case OPCODES.JMP:
            if (operand !== null) {
                IP = operand;
                log(`JMP para: ${IP}`);
            } else {
                IP += 2;
            }
            break;

        case OPCODES.JZ:
            if (A === 0 && operand !== null) {
                IP = operand;
                log(`JZ para: ${IP}`);
            } else {
                IP += 2;
            }
            break;

        case OPCODES.IN:
            A = dataBus;
            log(`IN: A = ${A}`);
            IP += 1;
            break;

        case OPCODES.OUT:
            dataBus = A;
            IRQ2 = true; // Sinaliza a interrupção IRQ2
            log(`OUT: A = ${A}`);
            IP += 1;
            break;

        case OPCODES.INC:
            if ([REGISTER_CODES['A'], REGISTER_CODES['B'], REGISTER_CODES['C']].includes(operand)) {
                let regName = getRegisterNameByCode(operand);
                let value = getRegisterValue(regName);
                setRegisterValue(regName, value + 1);
                log(`INC: ${regName} = ${value + 1}`);
            } else {
                log(`Erro: Operando inválido para INC: ${operand}`);
            }
            IP += 2;
            break;

        case OPCODES.DEC:
            if ([REGISTER_CODES['A'], REGISTER_CODES['B'], REGISTER_CODES['C']].includes(operand)) {
                let regName = getRegisterNameByCode(operand);
                let value = getRegisterValue(regName);
                setRegisterValue(regName, value - 1);
                log(`DEC: ${regName} = ${value - 1}`);
            } else {
                log(`Erro: Operando inválido para DEC: ${operand}`);
            }
            IP += 2;
            break;

        default:
            log(`Erro na execução: Opcode desconhecido ${opcode}`);
            IP += 1;
            break;
    }

    // Atualiza o opcode atual para a interface
    currentOpcode = opcode;
}

// Funções auxiliares para acessar registradores
export function getRegisterValue(register) {
    switch (register) {
        case 'A':
            return A;
        case 'B':
            return B;
        case 'C':
            return C;
        default:
            log(`Registrador desconhecido: ${register}`);
            return 0;
    }
}

export function setRegisterValue(register, value) {
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
            log(`Registrador desconhecido: ${register}`);
            break;
    }
}

function getRegisterNameByCode(code) {
    for (const [key, value] of Object.entries(REGISTER_CODES)) {
        if (value === code) {
            return key;
        }
    }
    return null;
}

// Getter e Setter para IP
export function getIP() {
    return IP;
}

export function setIP(value) {
    IP = value;
}

// Getter e Setter para dataBus
export function getDataBus() {
    return dataBus;
}

export function setDataBus(value) {
    dataBus = value;
}

// Getter e Setter para controlBus
export function getControlBus() {
    return { ...controlBus }; // Retorna uma cópia para evitar manipulação direta
}

export function setControlBus(newControlBus) {
    controlBus.read = newControlBus.read;
    controlBus.write = newControlBus.write;
    controlBus.io = newControlBus.io;
}

// Getter e Setter para IRQ1
export function getIRQ1() {
    return IRQ1;
}

export function setIRQ1(value) {
    IRQ1 = value;
}

// Getter e Setter para IRQ2
export function getIRQ2() {
    return IRQ2;
}

export function setIRQ2(value) {
    IRQ2 = value;
}

// Getter para currentOpcode
export function getCurrentOpcode() {
    return currentOpcode;
}

// Função para checar e tratar interrupções
export function checkInterrupts() {
    if (IRQ1) {
        handleIRQ1();
        IRQ1 = false;
    }
    if (IRQ2) {
        handleIRQ2();
        IRQ2 = false;
    }
}

// Função para tratar a interrupção IRQ1 (teclado)
function handleIRQ1() {
    log('IRQ1: Interrupção do teclado tratada. Valor disponível no dataBus.');
    // Aqui você pode implementar alguma lógica se necessário
}

// Função para tratar a interrupção IRQ2 (display)
function handleIRQ2() {
    log('IRQ2: Interrupção do display tratada. Display atualizado com o valor do dataBus.');
    if (updateDisplayCallback) {
        updateDisplayCallback(dataBus);
    }
}

// Função para resetar o simulador
export function resetSimulator() {
    // Limpa a memória e registradores
    memory.fill(0);
    A = 0;
    B = 0;
    C = 0;
    IP = 0;
    dataBus = 0;
    controlBus.read = false;
    controlBus.write = false;
    controlBus.io = false;
    IRQ1 = false;
    IRQ2 = false;
    currentOpcode = null;
    log('Simulador resetado.');
}

// Expondo o objeto OPCODES para uso no pc101-gui.js
export { OPCODES };