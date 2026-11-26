# Mapa funcional do Visor Finance (referência para o Lumina)

> **Objetivo.** Registrar *o que* o Visor faz (telas, regras, fluxos) para recriarmos as funções no Lumina
> com **design, textos e código próprios**. Nada aqui é código, asset, texto literal ou marca do Visor.
>
> **Coleta.** 08/11/2026, painel web `dashboard.visorfinance.app`, conta do Felipe (plano Pro), modo
> somente leitura: formulários foram apenas abertos e cancelados; nenhuma alteração salva; o painel de
> notificações não foi aberto (abri-lo marcaria itens como lidos).
>
> **Privacidade.** Valores, nomes de pessoas, estabelecimentos e números de conta vistos na coleta
> **não** foram transcritos. Exemplos usam valores fictícios (`R$ X`). Não há prints: todas as telas
> exibiam dados reais.

---

## 1. Estrutura global

| Elemento | Função |
|---|---|
| **Menu lateral** em 3 grupos | *Organização*: Visão Geral, Transações, Recorrentes, Fluxo de Caixa · *Controle financeiro*: Contas e Cartões, Categorias, Metas · *Visão estratégica*: Projeção, Patrimônio. Rodapé: Ajuda, seletor de **Espaço** (ex.: "Pessoal"), atalho para Configurações. Recolhível. |
| **Ocultar valores** (ícone de olho) | Mascara todos os montantes da interface. |
| **Busca / paleta de comandos** (Ctrl/⌘+K) | Navega para qualquer tela e para qualquer item de configuração (idioma, moeda, início do ciclo, orçamento, notificações...). |
| **Status de sincronização** | Mostra "última sincronização há Xh", próxima execução agendada e contador de sincronizações manuais do dia (ex.: 1 de 1). Botão *Sincronizar agora*. |
| **Seletor de mês** (no topo de várias telas) | Define o ciclo exibido. |
| **Notificações** (sino com contador) | Central de alertas (ver §11 Notificações). |
| **Botão "+" (Criar)** | Menu: Nova transação, Conectar conta, Nova meta, Nova conta fixa, Nova categoria, Nova regra, Nova tag, Novo investimento, Novo empréstimo. |
| **Assistente de IA** (botão flutuante) | Chat em tela cheia sobre as finanças do usuário; responde simulações ("e se eu cortar R$ X/mês?") usando projeção; mostra etapas de raciocínio, feedback 👍/👎, entrada por voz. |
| **Cartões de insight** (carrossel) | Aparecem em quase todas as telas: frases curtas geradas por regra (ex.: "gasto em categoria Y subiu R$ X vs. mesmo período", "parcela termina e libera R$ X", "risco de saldo negativo"). |
| **Espaços** | Separação de dados (ex.: Pessoal / Empresa). Contas podem ser movidas entre espaços. |

**Conceito central — ciclo.** Todas as telas mensais usam um *ciclo* que começa num dia configurável
(Configurações › Geral: "dia fixo do mês", padrão 1). Comparações "mês contra mês" usam **o mesmo dia
do ciclo anterior** (não o mês anterior inteiro), exceto o card *Resultado* (ver §2).

**Conceito central — regime do cartão.** Configuração *Competência* (compra conta no mês em que foi
feita) vs. *Caixa* (compra conta no mês do vencimento da fatura).

---

## 2. Visão Geral — `/`

**Propósito:** fotografia do mês corrente em uma tela.

| Card | Dados exibidos | Regra / cálculo observado | Interações |
|---|---|---|---|
| **Você gastou** | Diferença de gasto vs. mesmo período do ciclo anterior; mini-gráfico acumulado diário (atual vs. anterior). | `gasto(ciclo atual, dia 1→hoje) − gasto(ciclo anterior, dia 1→mesmo dia)`. Tooltip "Como comparamos" mostra os três números. | Tooltip; carrossel de insights abaixo (ex.: maior variação por categoria; sugestão de definir limite mensal). |
| **Contas a pagar** | Qtd. de cobranças pendentes, total e data-limite. | Recorrências + parcelas ainda não pagas no ciclo. | Link → Recorrentes. |
| **Gastos por…** (3 abas) | *Categorias*: rosca + lista top N (nome, %, valor). *Tipo de gasto*: barra 100% Fixo / Controlável / Variável. *Tags*. | % = gasto da categoria ÷ gasto total do ciclo. | Cada linha leva a Transações filtradas (categoria + intervalo do ciclo). Botão de filtros. |
| **Resultado** | Receita até agora, gasto até agora, resultado, % vs. mês anterior. | `receita − gasto` do ciclo até hoje; variação compara com o **mês anterior completo** (o próprio app avisa que no início do ciclo a variação fica distorcida). | Tooltip "Como calculamos". |
| **Patrimônio** | Patrimônio líquido, % variação, ativos, dívidas, linha de evolução. | `ativos − dívidas`. | Link → Patrimônio. |
| **Faturas em aberto** | Total das faturas abertas, saldo após pagamento, composição (contas fixas, parcelas, compras avulsas, pagamentos já feitos), e um mini-card por cartão (fecha em N dias, vence em N dias, usado / limite). | Saldo após pagamento = saldo em contas − total das faturas. | Tooltip "por que difere do app do banco". |
| **Reserva de emergência** | Estado (protegido / não), CTA para criar. | — | Abre criação de meta do tipo reserva. |
| **Metas** | Meta em foco, valor atual/alvo, previsão de conclusão. | Previsão = data em que o aporte médio atinge o alvo. | Link → Metas. |

---

## 3. Transações — `/transactions`

**Propósito:** extrato unificado de todas as contas e cartões.

**Topo — faixa de meses:** carrossel horizontal com ~12 meses passados e ~12 futuros; cada mês mostra
o resultado líquido e um ponto de linha (passado contínuo, futuro tracejado = projeção). Clicar filtra
o mês (`?month=AAAA-MM`).

**Abas de visualização:**
- *Extrato* — lista agrupada por dia (Hoje, Ontem, data). Seção recolhível **Previstos** (recorrências
  e parcelas futuras do ciclo) e **Aguardando o banco** (parcelas de cartão esperadas que o banco ainda
  não enviou — já entram no total para ele não mudar quando chegarem).
- *Categoria* — rosca + barras horizontais por categoria com % do total.
- *Tipo de gasto* — Fixo / Controlável / Variável com explicação de cada tipo e total.

**Barra de ferramentas:** busca textual; contador de transações; total de receitas; total de despesas;
resultado; botões **Importar extrato**, **Exportar CSV** (respeita filtros/ordem), **Compartilhar**.

**Filtros** (menu): Data, Conta, Categoria, Tipo (entrada/saída), Visibilidade (inclui ignoradas),
Meio de pagamento, Fatura, Parcelas. **Ordenação:** Data, Valor. Botões *Limpar tudo* / *Aplicar*.
Filtros vão para a URL (`categories=`, `from_date=`, `to_date=`, `sort_by=`, `sort_direction=`).

**Linha da transação:** ícone da categoria, descrição, categoria, conta/cartão (últimos dígitos),
indicador de parcela `n/N` ou "Mensal", valor (e valor em moeda estrangeira quando houver).

**Menu "⋮" da linha:**
- Ignorar esta transação · Marcar como recorrente
- *Automações:* Recategorizar transações como esta · Ignorar transações como esta · Aplicar tags assim
- Excluir transação

**Detalhe da transação** (gaveta lateral): tipo (entrada/saída), descrição, valor; chips de data/hora,
categoria, conta, tag; flag de *tipo de gasto*; *Associar a* (vincular a outra transação/meta);
*Adicionar nota*; *Dividir* (split em várias categorias). Bloco **Parcela n de N** (valor da parcela,
valor total, início, fim, barra de progresso). Bloco **Conta fixa** (serviço, valor esperado,
próxima/última cobrança, periodicidade). Chave **Excluir dos relatórios**. **Anexos** (JPG/PNG/PDF/WEBP
até 10 MB). Editar (lápis).

**Nova transação** (modal): Entrada/Saída; nome; valor; categoria; conta (inclui *Carteira* manual);
*Avulsa* vs. recorrente; data e hora; *Excluir dos relatórios*; notas; tags. Botões Cancelar / Criar.

**Importar extrato** (assistente em 3 passos): 1) escolher a conta de destino; 2) enviar arquivo
**OFX, PDF, XLSX ou CSV** de qualquer banco; 3) revisar as transações com categoria sugerida antes de
gravar.

---

## 4. Recorrentes — `/recurring`

**Propósito:** agenda de contas fixas e parcelas (despesas) e de receitas recorrentes.

- Abas **Despesas** / **Receitas** (`?type=income`); navegação por mês; filtro *Todas as contas*.
- Card destaque **Falta pagar neste ciclo** (soma das cobranças pendentes) + carrossel: valor que fica
  livre no mês seguinte (parcelas que terminam), custo anual das contas fixas.
- Gráfico **Próximos 6 meses**: barras empilhadas Parcelas × Contas fixas.
- Resumo do mês: Parcelas, Contas fixas, Total, **Saldo previsto** com variação vs. ciclo anterior.
- **Gasto por conta**: barras por conta/cartão com valor e %.
- Lista **Contas fixas (N)** agrupada por dia de vencimento: nome, categoria, valor, periodicidade.
- Lista **Parcelas (N)**: nome, categoria, valor, `n/N`.
- Botão **Nova recorrência**.

**Regra implícita:** recorrências são detectadas automaticamente a partir do histórico (mesmo
descritor/valor em intervalo regular) e podem ser marcadas manualmente na transação.

---

## 5. Fluxo de Caixa — `/cashflow`

**Propósito:** entradas × saídas ao longo de um período.

- Período: Este mês, Mês passado, Últimas 4 semanas, Últimos 3/6/12 meses, Este ano, Personalizado.
- **Resultado líquido** do período + % vs. período anterior; barras mensais positivas/negativas.
- Insights (ex.: em quantos meses o gasto superou a receita; % da receita guardada).
- **Resumo do mês selecionado:** Receitas; Despesas, desdobradas em Contas fixas, Parcelas e Gastos do
  dia a dia; Ganho/Perda com variação vs. mês anterior. Botão *Ver transações do mês*.
- Aba **Gastos / Receitas**: total do período, barras por mês, variação vs. período anterior equivalente.
- **Para onde foi** (expansível): diagrama **Sankey** Receita → {Despesas, Guardado} → grupo de
  categoria → categoria, com valores em cada nó.

---

## 6. Contas e Cartões — `/accounts`, `/cards`

### 6.1 Contas
- **Saldo total** das contas; linha com total de cartões (negativo) e **Líquido** (`contas − cartões`).
- Agrupado por instituição: nome, status ("Atualizado há Xh"), contas com número mascarado, saldo,
  entradas e saídas do ciclo. Grupo **Contas manuais** (ex.: Carteira).
- Menu da conta: Editar, Mover para espaço, Desconectar banco, Ocultar conta.
- **Adicionar conta** (Open Finance ou manual).
- **Transferências inteligentes** (`/accounts/smart-transfers`, plano Premium): identificar
  transferências entre contas do próprio usuário para não contá-las como gasto/receita.

### 6.2 Cartões
- Filtro: *Todos os cartões* ou um cartão (`?card=<id>`). Navegação por mês da fatura.
- **Total a pagar** + próxima fatura; gráfico de área do valor das faturas (passado sólido, futuro
  tracejado).
- **Como o total é calculado:** `+ compras lançadas − créditos/devoluções − pagamentos da fatura +
  lançamentos previstos incluídos = total estimado`.
- **Composição das compras:** Parcelas, Recorrentes, Compras avulsas.
- Por cartão: **limite total, usado, disponível; dia de fechamento, dia de vencimento, melhor dia de
  compra** (= dia seguinte ao fechamento).
- Aba **Detalhes da fatura**: card por cartão (fecha em N dias, vence em N dias, usado/limite, % do
  limite, status Aberta/Fechada/Paga) + lista de compras da fatura (descrição, data, `n/N`, valor;
  pagamentos e descontos de antecipação aparecem como créditos).
- Aba **Ciclos**: linha do tempo (Gantt) com a janela de cada fatura por cartão e marcador de "hoje".
- Botões: Criar cartão (manual), Entender minhas faturas, Opções da fatura.

---

## 7. Categorias — `/categories`

Abas: **Categorias**, **Tipo de gasto**, **Tags**, **Automações** + Filtros.

### 7.1 Categorias (orçamento)
- **Despesas / Receitas**; navegação por mês.
- Rosca com o total do mês e **limite mensal** (`gasto / limite`, editável).
- Banner: reaproveitar os limites do mês anterior.
- **Árvore de 2 níveis** (grupo › categoria), arrastar-e-soltar para reorganizar ou promover a
  categoria principal. Cada linha: valor gasto no mês (e limite, quando definido); link para
  Transações filtradas; menu: **Definir limite**, **Ocultar**.
- Taxonomia padrão observada (grupos): Alimentação, Serviços digitais, Compras, Serviços, Transporte,
  Moradia, Saúde, Impostos, Automotivo, Doações, Educação, Empréstimos e financiamentos, Jogos de
  azar, Lazer, … + categorias criadas pelo usuário. Cada categoria tem ícone e cor.
- **Nova categoria**.

### 7.2 Tipo de gasto
Classificação de cada categoria em **Fixo** (recorrente obrigatório), **Controlável** (recorrente que dá
para cancelar) ou **Variável** (muda com o dia a dia).

### 7.3 Tags
Total gasto com tags no mês; lista de tags; **Nova tag**. Tags são transversais às categorias.

### 7.4 Automações (regras)
- Lista ordenada (prioridade por arrastar), com seleção múltipla, liga/desliga por regra e menu:
  **Aplicar a todas** (retroativo), Editar, Excluir.
- Editor: **Quando** <condição> **então** <ação>. Condições: *Nome* (ou nome original) contém,
  *Valor*, *Categoria*, *Conta*, *Cartão*, *Data* — várias condições combinadas. Ações: categoria
  vira X, aplicar tags, ignorar. Mostra "N transações encontradas" (prévia do alcance).
- Regras nascem também do menu da transação ("Recategorizar transações como esta").

---

## 8. Metas — `/goals`

- Janela de meses (padrão próximos 6) com navegação; gráfico **Alocado em metas** por mês;
  *Alterar alocação*.
- Resumo do mês: metas ativas e quanto foi alocado em cada.
- Filtros de estado: Em andamento, Prontas, Concluídas, Arquivadas. **Metas em foco**.
- Card da meta: atual/alvo, %, prazo restante, aporte mensal necessário vs. realizado, status
  ("fora do prazo"), previsão de conclusão.
- Agrupamento por **momento de vida** (ex.: casa própria, filho, independente) — escolhido no
  assistente de **Nova meta** (passo 1: momento; depois nome, valor, prazo).
- Bloco **Reserva de emergência**.

---

## 9. Projeção — `/projection`

**Propósito:** saldo futuro mês a mês.

- Horizonte: 3M, 6M, 12M, Personalizado.
- **Saldo projetado** ao fim do horizonte e variação no período; gráfico de barras (resultado líquido
  por mês) + linha (saldo projetado acumulado).
- Insights: risco de saldo negativo (mês e valor), parcelamentos terminando, receitas não configuradas.
- **Detalhamento do mês** (expansível por bloco):
  - *Saldo inicial* = saldo atual das contas incluídas (lista de contas com saldo).
  - *Receitas* = receitas recorrentes pendentes (CTA para cadastrar receita).
  - *Gastos* = recorrências pendentes + parcelamentos pendentes + **gastos avulsos estimados**.
    Avulsos = `limite mensal − contas fixas − parcelas` (limite baseado num mês de referência).
    Chave **Incluir dia a dia**.
  - *Metas* = aportes mensais necessários; chave **Incluir metas na projeção**.
  - **Saldo projetado** = `saldo inicial + receitas − gastos − metas`.
- Fórmula do saldo do mês seguinte: saldo projetado do mês anterior vira saldo inicial.

---

## 10. Patrimônio — `/portfolio`

Abas **Ativos** / **Dívidas**; período (ex.: últimos 7 dias).

- **Ativos:** Patrimônio líquido e variação; insights (concentração em caixa, renda fixa vencendo,
  endividamento alto); gráfico de evolução (ativos, dívidas, **endividamento = dívidas ÷ ativos**, alerta
  acima de 50%; histórico só após 7 dias de coleta); **Composição** por classe (Caixa, Renda fixa, …)
  com %; lista por classe → ativo (nome, indexador ex. "100% do CDI", valor); **Adicionar investimento
  manual**; editar investimento.
- **Dívidas:** saldo devedor; Empréstimos, Faturas abertas, **Juros por mês** (quando há taxa);
  evolução; lista de dívidas em andamento (empréstimos/financiamentos, via Open Finance ou manual);
  aviso de que o valor de quitação exato vem do credor.

---

## 11. Configurações — `/settings/*`

| Seção | Rota | Conteúdo |
|---|---|---|
| Conta | `/settings/account` | Foto, dados do usuário, 2FA (Ativar), sair, **Recomeçar** (zerar dados), **Excluir** conta. |
| Plano | `/settings/plan` | Plano atual (Pro/Premium, mensal/anual), nº de bancos usados/limite, gerenciar/cancelar, lista de recursos do plano. |
| Preferências | `/settings/preferences` | Telemetria, **Orçamento** on/off, recursos em teste, **memórias da IA** (ver/editar/excluir), tema Claro/Sistema/Escuro. |
| Notificações | `/settings/notifications` | Matriz evento × canal (**E-mail, Push, WhatsApp**). Eventos: lembretes de contas, alertas de orçamento, novas transações, transação grande, resumo semanal, renovação de assinaturas, vencimento de contas fixas, lembretes de metas, previsão de saldo negativo, antecipação de parcelas, relatório mensal, rotinas de IA, fechamento do cartão, manutenção/problemas de conexão bancária, alertas de preço, desejos que cabem no saldo. |
| Espaços | `/settings/spaces` | Criar/editar/trocar espaço. |
| Geral | `/settings/general` | Idioma (PT-BR/EN), moeda de exibição, **dia de início do ciclo**, **competência × caixa** para cartão. |
| Rotinas | `/settings/routines` | Rotinas de IA agendadas (criadas pelo chat). |
| Calendário | `/settings/calendar` | Link iCal por espaço com fontes (recorrências, parcelas, transações agendadas, faturas) + sync com Google Calendar. |
| Apps conectados | `/settings/connected_apps` | Servidor **MCP** para assistentes de IA; **API pessoal** com tokens (escopo leitura/escrita, validade, até 10 ativos). |
| Open Finance | `/settings/open_finance` | Bancos conectados; vínculos de **Pix com biometria** (iniciação de pagamento) e histórico de Pix. |
| Sobre | `/settings/about` | Versão/termos. |

Outras rotas vistas: `/login` (Google, Apple, e-mail), `/signup`, `/terms`, `/privacy`, `/logout`,
`/export/transactions.csv`.

---

## 12. Regras de negócio consolidadas

| # | Regra | Onde aparece |
|---|---|---|
| RN-01 | Ciclo mensal começa num dia configurável; todos os agregados mensais usam o ciclo. | Global |
| RN-02 | Comparação de gasto: mesmo intervalo de dias do ciclo anterior. | Visão Geral |
| RN-03 | Resultado do ciclo compara com o **mês anterior completo** (distorce no início do ciclo). | Visão Geral |
| RN-04 | Cartão em competência (data da compra) ou caixa (vencimento da fatura). | Configurações, Transações, Fluxo |
| RN-05 | Fatura estimada = compras − créditos − pagamentos + previstos (parcelas futuras já conhecidas e recorrências no cartão). | Cartões |
| RN-06 | Melhor dia de compra = dia seguinte ao fechamento. | Cartões |
| RN-07 | Parcelas: `n/N`, valor da parcela, valor total, início/fim; parcelas futuras geram lançamentos previstos. | Transações, Recorrentes |
| RN-08 | Recorrência detectada por padrão de descritor+valor+intervalo; pode ser marcada manualmente. | Recorrentes |
| RN-09 | Transação "ignorada"/"excluída dos relatórios" não entra em totais, orçamentos nem projeção. | Transações |
| RN-10 | Transferências entre contas próprias não são gasto nem receita. | Contas (Premium) |
| RN-11 | Tipo de gasto por categoria: Fixo / Controlável / Variável. | Categorias, Visão Geral |
| RN-12 | Orçamento = limite por categoria e limite mensal total; pode copiar do mês anterior. | Categorias |
| RN-13 | Regras: condições (nome/valor/categoria/conta/cartão/data) → ações (categoria/tags/ignorar); prioridade por ordem; aplicação retroativa opcional. | Automações |
| RN-14 | Projeção: saldo inicial + receitas recorrentes − recorrências − parcelas − avulsos estimados − metas (chaves para incluir/excluir). | Projeção |
| RN-15 | Patrimônio líquido = ativos (contas + investimentos) − dívidas (faturas abertas + empréstimos). Endividamento = dívidas ÷ ativos. | Patrimônio |
| RN-16 | Insights são frases geradas por regras a partir dos números da tela. | Todas |

---

## 13. Lacunas do Lumina em relação ao mapa

Situação do repositório em 08/11/2026 (Next.js 14 + Supabase + Recharts; deploy Vercel).

| Área | Lumina hoje | Falta |
|---|---|---|
| Visão Geral | Real: gasto do mês, resultado, top 10 categorias, patrimônio, recentes. | Comparação no mesmo intervalo do ciclo; abas Tipo de gasto/Tags; card de faturas; contas a pagar; metas; insights. |
| Transações | Real: lista. | Faixa de meses, filtros completos na URL, abas Categoria/Tipo, previstos, detalhe com parcela/anexos/notas/split, criar manual, exportar CSV, menu de automações. |
| Recorrentes | Real: detecção automática. | Receitas, 6 meses, gasto por conta, saldo previsto, criar/editar. |
| Fluxo de Caixa | Real: básico. | Seletor de período, desdobramento fixas/parcelas/dia a dia, Sankey. |
| Contas | Real. | Contas manuais, ocultar, líquido contas − cartões. |
| Cartões (`/bills`) | **Exemplo (mock).** | Tudo: limite, ciclo, fatura estimada, composição, Gantt de ciclos. |
| Categorias | Real + gerenciador. | Árvore 2 níveis, limites (orçamento), tipo de gasto, tags, **motor de regras**. |
| Metas | **Exemplo.** | Tudo. |
| Projeção | **Exemplo.** | Motor de projeção (RN-14). |
| Patrimônio | **Exemplo.** | Investimentos e dívidas reais, composição, endividamento. |
| Configurações | Perfil/plano. | Ciclo, competência×caixa, tema, notificações. |
| Importação | OFX/CSV. | Revisão antes de gravar; XLSX/PDF (opcional). |

**Ponto de atenção de marca:** o Lumina usa hoje o subtítulo "Clareza" e o slogan "Clareza Financeira",
que é o mesmo slogan exibido no título das páginas do Visor. Recomendo trocar por um slogan próprio.

---

## 14. Plano de construção — aprovado pelo Felipe em 08/11/2026

| Fase | Entrega | Regras |
|---|---|---|
| 0. Base de dados | Migrações Supabase: árvore de categorias + tipo de gasto, tags, regras, recorrências, parcelas, cartões (limite, fechamento, vencimento), faturas, metas, investimentos, dívidas, configurações do usuário (dia do ciclo, competência × caixa). Sync Open Finance passa a gravar cartões, investimentos e empréstimos. | RN-01, RN-04 |
| 1. Uso diário | Transações (filtros na URL, faixa de meses, detalhe com parcela/nota/split, lançamento manual, export CSV, ignorar); Categorias com árvore e limites; motor de regras com aplicação retroativa. | RN-07, 09, 11, 12, 13 |
| 2. Cartões e Recorrentes | Fatura estimada, composição, melhor dia de compra, Gantt de ciclos; receitas recorrentes; próximos 6 meses. | RN-05, 06, 08 |
| 3. Painéis | Visão Geral com comparação no mesmo intervalo do ciclo; Fluxo de Caixa com Sankey; insights por regra. | RN-02, 03, 16 |
| 4. Visão estratégica | Projeção, Metas, Patrimônio com endividamento. | RN-14, 15 |
| 5. Configurações | Ciclo, competência × caixa, tema, link iCal. | — |

**Fora da v1:** chat de IA, alertas WhatsApp/e-mail, Pix, API pessoal/MCP, espaços múltiplos, transferências inteligentes.
**Método:** teste primeiro → código → teste; aprovação do Felipe ao fim de cada fase. Identidade visual própria do Lumina; partes SaaS (trial, Stripe, CPF/CNPJ) mantidas.
**Pendência de marca:** trocar o slogan "Clareza Financeira" por um próprio.
