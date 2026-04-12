import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Chip, EmptyState, FieldLabel, InputField, PrimaryButton, ProgressBar, ScreenHeader, SectionCard } from "@/components/finance/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-store";

export default function BudgetsScreen() {
  const { state, addBudget, addGoal, editBudget, removeBudget, editGoal, removeGoal, getBudgetSpent, getCategoryById, formatCurrency } = useFinance();
  const expenseCategories = useMemo(() => state.categories.filter((category) => category.type === "expense"), [state.categories]);

  const [budgetCategoryId, setBudgetCategoryId] = useState(expenseCategories[0]?.id ?? "");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalDeadline, setGoalDeadline] = useState(new Date().toISOString().slice(0, 10));
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const handleBudgetSave = () => {
    const parsedAmount = Number(budgetAmount.replace(",", "."));
    if (!parsedAmount || !budgetCategoryId) return;
    if (editingBudgetId) {
      editBudget(editingBudgetId, { categoryId: budgetCategoryId, amount: parsedAmount });
      setEditingBudgetId(null);
    } else {
      addBudget({ categoryId: budgetCategoryId, amount: parsedAmount });
    }
    setBudgetAmount("");
  };

  const handleBudgetEdit = (budget: typeof state.budgets[0]) => {
    setBudgetCategoryId(budget.categoryId);
    setBudgetAmount(budget.amount.toString());
    setEditingBudgetId(budget.id);
  };

  const handleBudgetDelete = (budgetId: string) => {
    removeBudget(budgetId);
    if (editingBudgetId === budgetId) {
      setEditingBudgetId(null);
      setBudgetAmount("");
    }
  };

  const handleGoalSave = () => {
    const parsedTarget = Number(goalTarget.replace(",", "."));
    const parsedCurrent = Number(goalCurrent.replace(",", ".")) || 0;
    if (!parsedTarget || !goalName.trim()) return;
    if (editingGoalId) {
      editGoal(editingGoalId, {
        name: goalName,
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        deadline: goalDeadline,
      });
      setEditingGoalId(null);
    } else {
      addGoal({
        name: goalName,
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        deadline: goalDeadline,
      });
    }
    setGoalName("");
    setGoalTarget("");
    setGoalCurrent("");
  };

  const handleGoalEdit = (goal: typeof state.goals[0]) => {
    setGoalName(goal.name);
    setGoalTarget(goal.targetAmount.toString());
    setGoalCurrent(goal.currentAmount.toString());
    setGoalDeadline(goal.deadline);
    setEditingGoalId(goal.id);
  };

  const handleGoalDelete = (goalId: string) => {
    removeGoal(goalId);
    if (editingGoalId === goalId) {
      setEditingGoalId(null);
      setGoalName("");
      setGoalTarget("");
      setGoalCurrent("");
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Planejamento"
          title="Orçamentos e metas"
          subtitle="Defina limites por categoria e acompanhe objetivos financeiros sem perder o contexto do mês."
        />

        <SectionCard title="Novo orçamento" subtitle="Escolha uma categoria de despesa e defina um limite mensal para acompanhar o consumo.">
          <View className="gap-4">
            <View className="gap-2">
              <FieldLabel>Categoria</FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                {expenseCategories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    selected={budgetCategoryId === category.id}
                    onPress={() => setBudgetCategoryId(category.id)}
                  />
                ))}
              </View>
            </View>
            <View>
              <FieldLabel>Limite mensal</FieldLabel>
              <InputField
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="decimal-pad"
                placeholder="0,00"
                returnKeyType="done"
              />
            </View>
            <PrimaryButton label={editingBudgetId ? "Atualizar orçamento" : "Salvar orçamento"} onPress={handleBudgetSave} />
          </View>
        </SectionCard>

        <SectionCard title="Orçamentos ativos" subtitle="Os indicadores abaixo são atualizados conforme você registra despesas nas categorias relacionadas.">
          <View className="gap-4">
            {state.budgets.length === 0 ? (
              <EmptyState
                title="Sem orçamentos definidos"
                subtitle="Cadastre limites mensais para acompanhar gastos e evitar excessos por categoria."
              />
            ) : (
              state.budgets.map((budget) => {
                const spent = getBudgetSpent(budget);
                const category = getCategoryById(budget.categoryId);
                const progress = budget.amount > 0 ? spent / budget.amount : 0;
                return (
                  <View key={budget.id} className="gap-2 rounded-[24px] border border-border bg-background px-4 py-4">
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{category?.name ?? "Categoria"}</Text>
                        <Text className="text-xs leading-5 text-muted">Mês de referência {budget.month}</Text>
                      </View>
                      <View className="flex-row gap-2">
                        <Text className="text-xs font-semibold text-muted">{Math.round(progress * 100)}%</Text>
                      </View>
                    </View>
                    <ProgressBar value={progress} color={progress > 1 ? "#EF4444" : category?.color ?? "#2F6BFF"} />
                    <Text className="text-xs leading-5 text-muted">
                      {formatCurrency(spent)} consumidos de {formatCurrency(budget.amount)} planejados.
                    </Text>
                    <View className="flex-row gap-2 pt-2">
                      <PrimaryButton label="Editar" onPress={() => handleBudgetEdit(budget)} />
                      <PrimaryButton label="Deletar" onPress={() => handleBudgetDelete(budget.id)} tone="secondary" />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </SectionCard>

        <SectionCard title="Nova meta financeira" subtitle="Use metas para separar objetivos de médio prazo, reserva e compras planejadas.">
          <View className="gap-3">
            <View>
              <FieldLabel>Nome da meta</FieldLabel>
              <InputField value={goalName} onChangeText={setGoalName} placeholder="Ex.: Viagem, reserva, notebook" returnKeyType="done" />
            </View>
            <View>
              <FieldLabel>Valor-alvo</FieldLabel>
              <InputField value={goalTarget} onChangeText={setGoalTarget} keyboardType="decimal-pad" placeholder="0,00" returnKeyType="done" />
            </View>
            <View>
              <FieldLabel>Valor atual</FieldLabel>
              <InputField value={goalCurrent} onChangeText={setGoalCurrent} keyboardType="decimal-pad" placeholder="0,00" returnKeyType="done" />
            </View>
            <View>
              <FieldLabel>Prazo</FieldLabel>
              <InputField value={goalDeadline} onChangeText={setGoalDeadline} placeholder="AAAA-MM-DD" autoCapitalize="none" returnKeyType="done" />
            </View>
            <PrimaryButton label={editingGoalId ? "Atualizar meta" : "Salvar meta"} onPress={handleGoalSave} tone="secondary" />
          </View>
        </SectionCard>

        <SectionCard title="Metas ativas" subtitle="Os objetivos cadastrados permanecem visíveis para orientar o comportamento financeiro do mês.">
          <View className="gap-4">
            {state.goals.map((goal) => {
              const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
              return (
                <View key={goal.id} className="gap-2 rounded-[24px] border border-border bg-background px-4 py-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-sm font-semibold text-foreground">{goal.name}</Text>
                    <Text className="text-xs font-semibold text-muted">Prazo {goal.deadline}</Text>
                  </View>
                  <ProgressBar value={progress} color="#8B5CF6" />
                  <Text className="text-xs leading-5 text-muted">
                    {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)} acumulados.
                  </Text>
                  <View className="flex-row gap-2 pt-2">
                    <PrimaryButton label="Editar" onPress={() => handleGoalEdit(goal)} />
                    <PrimaryButton label="Deletar" onPress={() => handleGoalDelete(goal.id)} tone="secondary" />
                  </View>
                </View>
              );
            })}
          </View>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
