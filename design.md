# Design do Produto

## Visão do aplicativo

O **Meu Financeiro** será um aplicativo mobile em orientação retrato, pensado para uso com uma mão e navegação rápida, com linguagem visual próxima a aplicativos iOS contemporâneos. A proposta é oferecer uma visão clara da saúde financeira do usuário, reduzir atrito no registro de lançamentos e facilitar acompanhamento de orçamento, metas, cartões, contas e compromissos futuros. A experiência inicial será local, com persistência no dispositivo, evitando dependência de conta online nesta primeira versão.

## Princípios de interface

A interface deve priorizar clareza, hierarquia visual forte, áreas de toque confortáveis, cartões com espaçamento generoso e navegação por abas. As ações mais frequentes, como adicionar receita ou despesa, consultar saldo e revisar orçamento, precisam estar sempre acessíveis em poucos toques. O layout deve favorecer leitura rápida de valores, diferenciação entre entradas e saídas e feedback imediato após cada interação.

## Lista de telas

| Tela | Objetivo principal | Conteúdo e componentes | Funcionalidades |
| --- | --- | --- | --- |
| Onboarding | Introduzir o propósito do app e configurar perfil financeiro inicial | Slides curtos, resumo de benefícios, escolha de moeda e preferências | Iniciar uso, definir perfil inicial, pular introdução |
| Dashboard | Exibir visão geral da situação financeira | Cartão de saldo total, receita do mês, despesa do mês, economia, metas, próximos vencimentos, gráfico resumido, atalhos rápidos | Ver panorama, acessar ações rápidas, navegar para áreas detalhadas |
| Lançamentos | Listar movimentações financeiras | Lista por data, chips de filtro, busca, resumo superior por período | Filtrar, pesquisar, editar, excluir e visualizar lançamentos |
| Novo lançamento | Registrar uma movimentação | Formulário com tipo, valor, categoria, conta, cartão, data, recorrência, observação | Criar receita, despesa ou transferência |
| Categorias | Organizar classificação financeira | Lista de categorias, ícones, cores, total por categoria | Criar, editar, remover e visualizar categorias |
| Orçamentos | Controlar limites mensais | Cartões por categoria com valor previsto, valor gasto e progresso | Criar orçamento, ajustar limite e acompanhar consumo |
| Metas | Acompanhar objetivos financeiros | Cards de meta com valor-alvo, valor acumulado, prazo e progresso | Criar meta, registrar contribuição e acompanhar evolução |
| Contas e cartões | Gerir fontes de saldo e pagamento | Cartões de conta corrente, carteira, poupança e cartões de crédito | Criar contas, registrar limite, fechar fatura, acompanhar saldos |
| Relatórios | Analisar comportamento financeiro | Gráficos de pizza e barras, comparativos mensais, distribuição por categoria, tendências | Alternar período, entender gastos, identificar padrões |
| Planejamento | Visualizar compromissos futuros | Calendário mensal, lista de contas a pagar e receber, lembretes | Ver vencimentos, marcar pagamento e antecipar despesas |
| Perfil e ajustes | Personalizar o app | Preferências, moeda, notificações locais, tema, exportação futura | Ajustar experiência e preferências do usuário |

## Conteúdo principal e estrutura por tela

A **Dashboard** deve começar com um cartão principal de saldo consolidado, seguido de indicadores de receita, despesa e economia do período. Logo abaixo, haverá um bloco de ações rápidas para adicionar despesa, adicionar receita e criar meta. Em seguida, o usuário verá um gráfico compacto da evolução mensal, uma seção de orçamento com progresso e uma lista curta de próximos vencimentos.

A tela de **Lançamentos** deve ser construída para consulta rápida. O topo terá seleção de período e filtros por tipo, conta e categoria. A lista principal será cronológica, agrupada por dia, com células legíveis e foco em descrição, categoria, data e valor. O gesto de toque abrirá edição, enquanto ações secundárias permitirão exclusão ou duplicação.

A tela de **Novo lançamento** deve ser o fluxo mais eficiente do aplicativo. O usuário escolherá entre receita, despesa ou transferência em um seletor segmentado, informará o valor em destaque, depois categoria, conta, data e observação. Elementos opcionais, como recorrência e parcelamento, ficarão visíveis sem sobrecarregar a primeira dobra da tela.

A tela de **Relatórios** deve apresentar síntese visual simples, sem excesso de métricas. O usuário verá a distribuição dos gastos por categoria, comparação entre meses, média de despesas e evolução do saldo. A linguagem visual usará contraste moderado e explicações curtas para tornar a leitura acessível.

## Fluxos principais do usuário

| Fluxo | Etapas |
| --- | --- |
| Registrar despesa | Dashboard → ação rápida “Nova despesa” → formulário de lançamento → salvar → retorno com feedback e atualização do saldo |
| Registrar receita | Dashboard → ação rápida “Nova receita” → formulário de lançamento → salvar → atualização dos indicadores do mês |
| Criar orçamento | Aba de Orçamentos → adicionar orçamento → escolher categoria e limite → salvar → visualizar progresso no período |
| Criar meta financeira | Dashboard ou aba Metas → nova meta → definir objetivo, prazo e valor → salvar → acompanhar progresso no painel |
| Revisar gastos do mês | Dashboard → relatório resumido → tela de Relatórios → aplicar filtro mensal → analisar categorias e tendência |
| Gerir cartões | Aba Contas e cartões → selecionar cartão → visualizar limite, gastos e fechamento → ajustar dados ou registrar pagamento |
| Conferir compromissos futuros | Dashboard → próximos vencimentos ou aba Planejamento → visualizar calendário e lista → marcar item como pago |

## Navegação principal

A navegação deve usar barra inferior com cinco áreas: **Início**, **Lançamentos**, **Orçamentos**, **Relatórios** e **Mais**. O espaço **Mais** concentrará Metas, Categorias, Contas e cartões, Planejamento e Ajustes. O botão de criação rápida de lançamento poderá ser destacado visualmente na navegação ou por atalho fixo na Dashboard.

## Escolhas de cor

A identidade visual será baseada em tons que transmitam confiança, controle e tranquilidade.

| Elemento | Cor | Uso |
| --- | --- | --- |
| Primária | `#2F6BFF` | Ações principais, destaques, links, progresso positivo |
| Secundária | `#8B5CF6` | Apoio visual em metas, destaques secundários e comparativos |
| Fundo claro | `#F6F8FC` | Base das telas, mantendo aspecto limpo e arejado |
| Superfície | `#FFFFFF` | Cartões, módulos e células elevadas |
| Texto principal | `#0F172A` | Títulos, valores e conteúdo prioritário |
| Texto secundário | `#64748B` | Apoio, descrições e dados complementares |
| Sucesso | `#16A34A` | Receitas, metas cumpridas e evolução favorável |
| Alerta | `#F59E0B` | Orçamentos próximos do limite e lembretes |
| Erro | `#EF4444` | Despesas, extrapolação de orçamento e falhas |
| Linha/borda | `#E2E8F0` | Divisores discretos e contorno de componentes |

## Diretrizes de usabilidade

Todos os elementos interativos devem ter dimensão confortável para toque e hierarquia de contraste suficiente para leitura em movimento. O saldo e os valores mais importantes devem aparecer com alinhamento consistente e tipografia de fácil escaneamento. O aplicativo deve evitar ruído visual, mantendo cada tela com um objetivo principal e ações secundárias menos proeminentes.

## Escopo funcional inicial

A primeira entrega deve incluir dashboard, lançamentos, categorias, orçamentos, metas, contas/cartões, relatórios simplificados e preferências básicas. Recursos avançados, como sincronização em nuvem, compartilhamento familiar, importação bancária e automações inteligentes, podem ser adicionados em etapas futuras conforme a necessidade do usuário.
