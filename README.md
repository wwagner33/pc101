# Simulador de Computador Digital Binãrio Simples PC101

## Requisitos do Simulador PC101

1. **Registradores e Memória:**
   - **Acumulador (A):** Registrador de 8 bits para operações aritméticas/lógicas.
   - **Instruction Pointer (IP):** Indicador de instrução atual na memória.
   - **Outros Registradores:** Definiremos quais adicionais são necessários, possivelmente um registrador temporário para operações intermediárias.
   - **Memória Principal:** 100 posições de 8 bits, organizadas em um dicionário, com parte para código e parte para dados.

2. **Barramentos:**
   - **Barramento de Endereçamento:** Para acessar endereços de memória e I/O.
   - **Barramento de Dados:** Para transferência de dados entre registradores, memória e I/O.
   - **Barramento de Controle:** Ativação dos barramentos de dados e endereçamento.

3. **Periféricos:**
   - **Display Simples:** Mostra dados do processador ou saída de programa.
   - **Teclado Alfanumérico:** Permite entrada de valores para execução de programas interativos.

4. **Instruções do Processador:**
   - **Aritméticas:** Soma, subtração, etc.
   - **Lógicas:** E, OU, NÃO, etc.
   - **Desvios e Condicionais:** Jump, Call, Return, com condicionais.
   - **I/O:** Leitura e escrita em periféricos.
   - **Processamento de Caracteres:** Conversões ou operações simples de manipulação de caracteres.

5. **Processo de Programação e Execução:**
   - **Assembly101 (A101):** Linguagem Assembly simples.
   - **Montador/Limpador:** Tradução de código A101 para binário.
   - **Carregador e Execução:** Coloca o programa na memória e permite execução passo-a-passo ou completa.

6. **Interface de Usuário:**
   - **Botões de Controle:** Avançar, Voltar, Executar tudo, Parar e Reboot.
   - **Visualização de Memória e Registradores:** Permite acompanhar o estado de cada registrador e posição de memória.
   - **Modo de Execução Manual/Automático:** Usuário controla instruções ou deixa o processador executá-las sequencialmente.


## Estruturação do Simulador

**1. Memória e Registradores:**  
   - Vamos representar a memória como um dicionário em JavaScript, com endereços (0–99) como chaves e valores de 8 bits.
   - Criar registradores `A`, `IP` e outros necessários como variáveis JavaScript. Esses registradores serão atualizados a cada instrução.

**2. Barramentos:**  
   - **Endereçamento:** Array que recebe valores de IP e outros, usado para direcionar onde carregar dados na memória.
   - **Dados:** Array onde o valor atual a ser transferido está armazenado, operando como uma espécie de buffer.
   - **Controle:** Define quando cada barramento está ativo, simulando habilitação de I/O ou endereçamento.

**3. Periféricos (Display e Teclado):**  
   - O display será um campo de saída na interface.
   - O teclado será um conjunto de botões, cada um representando um valor que o usuário pode inserir.

**4. Instruções:**  
   - Definir um conjunto básico de instruções que o processador entenderá. Exemplos:
      - `ADD`: Soma o valor no acumulador `A`.
      - `SUB`: Subtrai o valor.
      - `MOV`: Move dados entre registradores/memória.
      - `IN` / `OUT`: Para entrada e saída de dados.
      - `JMP`, `JNZ`: Instruções de salto.

**5. Assembly101 (A101) e Montador:**  
   - Criar uma sintaxe simples que o usuário poderá escrever, como `MOV A, 5`.
   - Implementar um montador que traduza essas instruções para binário e carregue na memória.

**6. Interface de Usuário e Controles:**  
   - **Passo a Passo:** Botão para avançar na execução.
   - **Voltar:** Retrocede uma instrução.
   - **Parar/Executar Tudo:** Para execução completa ou em etapas.

**7. Visualização de Memória e Registradores:**  
   - Painéis que mostrem o valor atual dos registradores e memória.
   - Atualização visual a cada ciclo de instrução.