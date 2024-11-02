# Simulador de Computador Digital Binário Simples PC101

Bem-vindo ao **Simulador PC101**, um simulador educacional de um computador digital binário simples. Este projeto tem como objetivo proporcionar uma compreensão prática dos princípios básicos de arquitetura de computadores, incluindo registradores, memória, barramentos, periféricos e conjunto de instruções.

**Autor:** Wellington Wagner F. Sarmento

---

## Descrição do Projeto

O PC101 é um simulador que emula o funcionamento de um computador básico de 8 bits. Ele permite que os usuários escrevam programas em uma linguagem assembly simplificada chamada **Assembly101 (A101)**, montem o código e executem no simulador. A interface gráfica facilita a visualização dos componentes do computador, como registradores, memória e barramentos, e permite acompanhar a execução do programa passo a passo.

---

## Funcionalidades

1. **Registradores e Memória:**
   - **Registradores:**
     - **Acumulador (A):** Registrador principal para operações aritméticas e lógicas.
     - **Registradores B e C:** Registradores auxiliares para armazenamento de dados.
     - **Instruction Pointer (IP):** Apontador para a instrução atual na memória.
   - **Memória Principal:**
     - 100 posições de 8 bits.
     - Dividida em área de código (endereços 0 a 69) e área de dados (endereços 70 a 99).

2. **Barramentos:**
   - **Barramento de Endereços:** Utilizado para acessar posições de memória e periféricos.
   - **Barramento de Dados:** Transferência de dados entre registradores, memória e I/O.
   - **Barramento de Controle:** Sinais de controle para operações de leitura, escrita e I/O.

3. **Periféricos:**
   - **Display Simples:** Exibe a saída dos programas ou valores dos registradores.
   - **Teclado Numérico:** Permite a entrada de valores para programas interativos.

4. **Conjunto de Instruções:**
   - **Aritméticas:**
     - `LOAD`: Carrega um valor imediato ou de um registrador para o acumulador `A`.
     - `ADD`: Soma um valor imediato ou de um registrador ao acumulador `A`.
     - `SUB`: Subtrai um valor imediato ou de um registrador do acumulador `A`.
     - `INC`: Incrementa o valor de um registrador.
     - `DEC`: Decrementa o valor de um registrador.
   - **Desvios e Condicionais:**
     - `JMP`: Salta para uma instrução específica.
     - `JZ`: Salta se o acumulador `A` for zero.
   - **I/O:**
     - `IN`: Lê um valor do `dataBus` para o acumulador `A`.
     - `OUT`: Escreve o valor do acumulador `A` no `dataBus` e atualiza o display.
   - **Armazenamento:**
     - `STORE`: Armazena o valor do acumulador `A` em um registrador ou na memória.

5. **Processo de Programação e Execução:**
   - **Assembly101 (A101):** Linguagem assembly simplificada para programação do PC101.
   - **Montador:** Traduz o código A101 em código de máquina e carrega na memória.
   - **Execução:**
     - Modo de execução completa ou passo a passo.
     - Possibilidade de visualizar a execução em tempo real.

6. **Interface de Usuário:**
   - **Controles:**
     - **Montar Código:** Monta o código A101 e carrega na memória.
     - **Carregar Programa:** Prepara o simulador para a execução.
     - **Executar Programa:** Executa todo o programa de uma vez.
     - **Executar Instrução:** Permite a execução passo a passo.
     - **Resetar Simulador:** Reinicia o simulador para o estado inicial.
   - **Visualizações:**
     - **Registradores:** Exibe o valor atual de `A`, `B`, `C` e `IP`.
     - **Memória:** Mostra o conteúdo da memória principal.
     - **Barramentos:** Indica os valores presentes nos barramentos de dados e endereços.
     - **Console de Log:** Exibe mensagens e logs durante a montagem e execução.
     - **Display e Teclado:** Permitem interação com o programa através de I/O.

---

## Como Utilizar o Simulador

1. **Escrever o Código A101:**
   - Utilize o editor de código para escrever programas na linguagem Assembly101.
   - Exemplo simples de programa:

     ```assembly
     /* Programa: Soma de 2 com 10 */

     LOAD 2;      // Carrega 2 no acumulador A
     ADD 10;      // Soma 10 ao acumulador A
     STORE B;     // Armazena o resultado em B
     OUT;         // Exibe o resultado no display
     ```

2. **Montar o Código:**
   - Clique no botão **"Montar Código"** para montar o programa.
   - Verifique o console de log para mensagens de sucesso ou erro.

3. **Carregar o Programa:**
   - Após a montagem bem-sucedida, clique em **"Carregar Programa"** para carregar o programa na memória.

4. **Executar o Programa:**
   - **Execução Completa:** Clique em **"Executar Programa"** para executar o programa inteiro.
   - **Execução Passo a Passo:** Clique em **"Executar Instrução"** para executar instrução por instrução.

5. **Interagir com o Programa:**
   - Utilize o teclado para inserir valores quando o programa solicitar (instrução `IN`).
   - O display será atualizado automaticamente quando o programa executar a instrução `OUT`.

6. **Visualizar o Estado do Simulador:**
   - Acompanhe os valores dos registradores, memória e barramentos durante a execução.
   - O console de log fornece informações detalhadas sobre cada instrução executada.

7. **Resetar o Simulador:**
   - Para iniciar um novo programa ou reiniciar o simulador, clique em **"Resetar Simulador"**.

---

## Arquivos do Projeto

- **pc101.js:** Implementação do processador, memória, barramentos e conjunto de instruções.
- **interface.js:** Lida com a interface gráfica, eventos do usuário e interação com o `pc101.js`.
- **pc101.html:** Arquivo HTML que compõe a interface gráfica do simulador.
- **teste.a101:** Exemplo de programa escrito em Assembly101 para testes.

---

## Requisitos Técnicos

- **Navegador Web:** O simulador é executado em um navegador web moderno que suporte JavaScript.
- **Sem Dependências Externas:** Não requer instalação de bibliotecas ou softwares adicionais.

---

## Observações Adicionais

- **Objetivo Educacional:** Este simulador foi desenvolvido com fins educacionais para auxiliar no aprendizado de arquitetura de computadores e programação em assembly.
- **Extensibilidade:** O código foi estruturado de forma modular para facilitar futuras extensões ou modificações, como a adição de novas instruções ou periféricos.
- **Feedback e Contribuições:** Feedbacks são bem-vindos. Se você deseja contribuir para o projeto, sinta-se à vontade para entrar em contato.

---

## Licença

Este projeto é disponibilizado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Obrigado por utilizar o Simulador PC101! Esperamos que ele seja uma ferramenta útil em seus estudos e experimentos.