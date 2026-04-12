import { ScrollView, Text, View } from "react-native";

import { ProgressBar, ScreenHeader, SectionCard, StatCard } from "@/components/finance/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-store";

export default function ReportsScreen() {
  const { state, monthlyIncome, monthlyExpense, monthlyNet, totalBalance, totalCardUsage, getCategoryById, formatCurrency } = useFinance();

  const expensesByCategory = state.transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.categoryId] = (accumulator[transaction.categoryId] ?? 0) + transaction.amount;
      return accumulator;
    }, {});

  const categoryReport = Object.entries(expensesByCategory)
    .map(([categoryId, amount]) => ({
      category: getCategoryById(categoryId),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const totalReportedExpenses = categoryReport.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Análise"
          title="Relatórios"
          subtitle="Entenda a distribuição das despesas, a evolução do mês e a composição atual do seu caixa."
        />

        <View className="gap-4">
          <View className="flex-row gap-4">
            <StatCard label="Receitas" value={formatCurrency(monthlyIncome)} helper="Entradas registradas no mês atual." tone="positive" />
            <StatCard label="Despesas" value={formatCurrency(monthlyExpense)} helper="Saídas lançadas no mesmo período." tone="negative" />
          </View>
          <View className="flex-row gap-4">
            <StatCard label="Resultado" value={formatCurrency(monthlyNet)} helper="Diferença entre receitas e despesas." tone="accent" />
            <StatCard label="Saldo" value={formatCurrency(totalBalance)} helper="Soma dos saldos das contas atuais." />
          </View>
        </View>

        <SectionCard title="Despesas por categoria" subtitle="A leitura abaixo evidencia onde se concentra a maior parte do seu consumo financeiro.">
          <View className="gap-4">
            {categoryReport.length === 0 ? (
              <Text className="text-sm leading-6 text-muted">Registre despesas para visualizar a distribuição por categoria e comparar prioridades.</Text>
            ) : (
              categoryReport.map((item) => {
                const share = totalReportedExpenses > 0 ? item.amount / totalReportedExpenses : 0;
                return (
                  <View key={item.category?.id ?? item.amount} className="gap-2 rounded-[24px] border border-border bg-background px-4 py-4">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="text-sm font-semibold text-foreground">{item.category?.name ?? "Categoria"}</Text>
                      <Text className="text-sm font-semibold text-foreground">{formatCurrency(item.amount)}</Text>
                    </View>
                    <ProgressBar value={share} color={item.category?.color ?? "#2F6BFF"} />
                    <Text className="text-xs leading-5 text-muted">Participação de {Math.round(share * 100)}% no total de despesas registradas.</Text>
                  </View>
                );
              })
            )}
          </View>
        </SectionCard>

        <SectionCard title="Contas e cartões" subtitle="Veja rapidamente o caixa distribuído entre contas e a utilização atual dos cartões cadastrados.">
          <View className="gap-4">
            {state.accounts.map((account) => (
              <View key={account.id} className="rounded-[24px] border border-border bg-background px-4 py-4">
                <Text className="text-sm font-semibold text-foreground">{account.name}</Text>
                <Text className="mt-1 text-xs text-muted">Tipo {account.kind}</Text>
                <Text className="mt-3 text-lg font-semibold text-foreground">{formatCurrency(account.balance)}</Text>
              </View>
            ))}
            {state.cards.map((card) => {
              const usage = card.limit > 0 ? card.currentBalance / card.limit : 0;
              return (
                <View key={card.id} className="gap-2 rounded-[24px] border border-border bg-background px-4 py-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-sm font-semibold text-foreground">{card.name}</Text>
                    <Text className="text-sm font-semibold text-foreground">{formatCurrency(card.currentBalance)}</Text>
                  </View>
                  <ProgressBar value={usage} color="#F59E0B" />
                  <Text className="text-xs leading-5 text-muted">
                    {Math.round(usage * 100)}% do limite utilizado. Limite total de {formatCurrency(card.limit)}.
                  </Text>
                </View>
              );
            })}
            <View className="rounded-[24px] border border-border bg-primary/10 px-4 py-4">
              <Text className="text-sm font-semibold text-foreground">Uso total de cartão</Text>
              <Text className="mt-2 text-xl font-bold text-foreground">{formatCurrency(totalCardUsage)}</Text>
              <Text className="mt-1 text-xs leading-5 text-muted">Essa visão consolida o valor pendente das faturas registradas no app.</Text>
            </View>
          </View>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
