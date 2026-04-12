import { ScrollView, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { SectionCard, ProgressBar, ScreenHeader, StatCard } from "@/components/finance/ui";
import { TransactionForm } from "@/components/finance/transaction-form";
import { useFinance } from "@/lib/finance-store";

export default function HomeScreen() {
  const { state, monthlyIncome, monthlyExpense, monthlyNet, totalBalance, totalCardUsage, upcomingReminders, formatCurrency, getBudgetSpent, getCategoryById } = useFinance();

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Meu Financeiro"
          title="Visão geral"
          subtitle="Acompanhe saldo, lançamentos, orçamentos e próximos compromissos em uma única experiência mobile."
        />

        <View className="gap-4">
          <View className="rounded-[32px] bg-primary px-5 py-6">
            <Text className="text-sm font-medium text-white/80">Saldo disponível</Text>
            <Text className="mt-3 text-4xl font-bold text-white">{formatCurrency(totalBalance)}</Text>
            <View className="mt-5 flex-row flex-wrap gap-3">
              <View className="rounded-[20px] bg-white/15 px-4 py-3">
                <Text className="text-xs uppercase tracking-[0.18em] text-white/70">Receitas</Text>
                <Text className="mt-1 text-lg font-semibold text-white">{formatCurrency(monthlyIncome)}</Text>
              </View>
              <View className="rounded-[20px] bg-white/15 px-4 py-3">
                <Text className="text-xs uppercase tracking-[0.18em] text-white/70">Despesas</Text>
                <Text className="mt-1 text-lg font-semibold text-white">{formatCurrency(monthlyExpense)}</Text>
              </View>
              <View className="rounded-[20px] bg-white/15 px-4 py-3">
                <Text className="text-xs uppercase tracking-[0.18em] text-white/70">Cartão</Text>
                <Text className="mt-1 text-lg font-semibold text-white">{formatCurrency(totalCardUsage)}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-4">
            <StatCard
              label="Resultado do mês"
              value={formatCurrency(monthlyNet)}
              helper={monthlyNet >= 0 ? "Seu mês está positivo até agora." : "As saídas superam as entradas do mês."}
              tone={monthlyNet >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Lançamentos"
              value={String(state.transactions.length)}
              helper="Movimentações registradas localmente no dispositivo."
              tone="accent"
            />
          </View>
        </View>

        <TransactionForm initialType="expense" title="Lançamento rápido" submitLabel="Adicionar movimentação" />

        <SectionCard title="Orçamentos do mês" subtitle="Acompanhe rapidamente onde o limite está mais próximo do consumo.">
          <View className="gap-4">
            {state.budgets.length === 0 ? (
              <Text className="text-sm leading-6 text-muted">Crie seu primeiro orçamento na aba correspondente para acompanhar limites por categoria.</Text>
            ) : (
              state.budgets.slice(0, 3).map((budget) => {
                const spent = getBudgetSpent(budget);
                const category = getCategoryById(budget.categoryId);
                const progress = budget.amount > 0 ? spent / budget.amount : 0;
                return (
                  <View key={budget.id} className="gap-2 rounded-[22px] bg-background px-4 py-4">
                    <View className="flex-row items-center justify-between gap-3">
                      <View>
                        <Text className="text-sm font-semibold text-foreground">{category?.name ?? "Categoria"}</Text>
                        <Text className="text-xs text-muted">{formatCurrency(spent)} de {formatCurrency(budget.amount)}</Text>
                      </View>
                      <Text className="text-xs font-semibold text-muted">{Math.round(progress * 100)}%</Text>
                    </View>
                    <ProgressBar value={progress} color={progress > 1 ? "#EF4444" : category?.color ?? "#2F6BFF"} />
                  </View>
                );
              })
            )}
          </View>
        </SectionCard>

        <SectionCard title="Metas e reservas" subtitle="Seus objetivos aparecem aqui para manter o planejamento visível diariamente.">
          <View className="gap-4">
            {state.goals.map((goal) => {
              const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
              return (
                <View key={goal.id} className="gap-2 rounded-[22px] bg-background px-4 py-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-sm font-semibold text-foreground">{goal.name}</Text>
                    <Text className="text-xs font-semibold text-muted">{Math.round(progress * 100)}%</Text>
                  </View>
                  <ProgressBar value={progress} color="#8B5CF6" />
                  <Text className="text-xs leading-5 text-muted">
                    {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)} até {goal.deadline}
                  </Text>
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Próximos vencimentos" subtitle="Itens futuros ajudam a antecipar saídas e preservar o fluxo de caixa.">
          <View className="gap-3">
            {upcomingReminders.length === 0 ? (
              <Text className="text-sm leading-6 text-muted">Sem compromissos pendentes por enquanto.</Text>
            ) : (
              upcomingReminders.map((reminder) => (
                <View key={reminder.id} className="flex-row items-center justify-between rounded-[22px] bg-background px-4 py-4">
                  <View className="gap-1">
                    <Text className="text-sm font-semibold text-foreground">{reminder.title}</Text>
                    <Text className="text-xs text-muted">Vencimento em {reminder.dueDate}</Text>
                  </View>
                  <Text className="text-sm font-semibold text-foreground">{formatCurrency(reminder.amount)}</Text>
                </View>
              ))
            )}
          </View>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
