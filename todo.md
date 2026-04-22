# Project TODO

- [ ] Onboarding inicial com configuração básica do perfil financeiro
- [x] Dashboard com saldo total, resumo do mês e atalhos rápidos
- [x] Cadastro e listagem de receitas, despesas e transferências
- [x] Persistência local dos dados no dispositivo
- [x] Gestão de categorias com cores e ícones
- [x] Gestão de contas financeiras e cartões
- [x] Controle de orçamentos por categoria
- [x] Metas financeiras com acompanhamento de progresso
- [x] Relatórios visuais com resumo por período e categoria
- [x] Planejamento com próximos vencimentos e compromissos
- [x] Aba de configurações com preferências básicas
- [x] Tema visual alinhado à identidade do produto
- [x] Logo exclusivo e atualização do branding do aplicativo
- [x] Testes básicos de componentes e fluxos principais
- [x] Revisão final da experiência mobile e validação do projeto

## v1.0.5 - Funcionalidades de Edição

- [x] Editar orçamentos salvos (nome, limite, categoria)
- [x] Editar metas financeiras (nome, valor, data)
- [x] Editar contas e cartões (nome, saldo inicial, tipo)
- [x] Editar categorias (nome, cor, ícone)
- [x] Deletar orçamentos, metas, contas e categorias com confirmação
- [x] Validar integridade dos dados ao editar
- [x] Testes de edição para todas as entidades


## v1.0.7 - Correção de Bundle ID e Editar Planejamento

- [x] Resolver conflito de bundle ID entre versões 1.0.0 e 1.0.5
- [x] Atualizar versão do app para 1.0.7 no app.config.ts
- [x] Adicionar funções de edição e remoção de lembretes (reminders) no provedor financeiro
- [x] Implementar interface de edição de planejamento na tela more.tsx
- [x] Adicionar testes para edição e remoção de lembretes
- [x] Validar que o novo APK instala como atualizacao (bundle ID mantido)


## v1.0.7 - Correção de Conflito de Assinatura

- [x] Criar arquivo eas.json para configurar assinatura consistente dos APKs
- [ ] Gerar novo APK 1.0.7 com configuração de assinatura corrigida
- [ ] Testar instalação do novo APK sobre versões anteriores


## v1.0.10 - Assinatura Legítima e Compatibilidade Total

- [x] Atualizar versão para 1.0.10 no app.config.ts
- [x] Garantir que eas.json força assinatura consistente (sem burlar verificações DEX)
- [x] Validar que bundle ID permanece igual para compatibilidade com versões anteriores
- [x] Gerar APK 1.0.10 com assinatura legítima via Publish
- [x] Testar instalação sobre versão 1.0.9 - deve instalar como atualização sem conflitos


## v1.0.11 - Aba Serasa e Melhorias de Categorias

- [x] Adicionar estrutura de dados para débitos (Serasa)
- [x] Implementar aba Serasa com três abas: Devendo, Pagando, Pago
- [x] Adicionar interface de criar novo débito
- [x] Adicionar interface de editar débito
- [x] Adicionar interface de deletar débito
- [x] Adicionar interface de marcar débito como pago
- [x] Melhorar interface de categorias com criar, editar e apagar
- [x] Adicionar categorias padrão: Alimentação, Transporte, Moradia, Lazer, Saúde
- [x] Adicionar testes para Serasa e categorias
- [x] Atualizar versão para 1.0.11

## v1.0.12 - Opcões e Melhorias
- [x] Adicionado o botão editar nos lançamentos
- [x] Corrigido o codigo de versão do app.config.ts
- [x] Adicionado o Botão de Importar e Exportar configurações em Mais
- [x] Adicionado o Botão de Exportar em PDF no relatórios
- [x] Corrigido o Package do app.config.ts
- [x] Adicionado a opcão Update na hotbar

## v1.0.13 - Sem nome por enquanto
- [x] Corrigido o bug de mostrar versão disponivel no updates
- [x] 
