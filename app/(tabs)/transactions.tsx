import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { TransactionForm } from "@/components/finance/transaction-form";
import { Chip, EmptyState, ScreenHeader, SectionCard } from "@/components/finance/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance, type EntryType, type FinanceTransaction } from "@/lib/finance-store";

type FilterType = EntryType | "all";

const labels: Record<FilterType, string> = {
  all: "Todos",
  income: "Receitas",
  expense: "Despesas",
  transfer: "Transferências",
};

export default function TransactionsScreen() {
  const { state, removeTransaction, getCategoryById, formatCurrency } = useFinance();

  const [filter, setFilter] = useState<FilterType>("all");

  // ✅ CONTROLE DE EDIÇÃO
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return state.transactions.filter((transaction) =>
      filter === "all" ? true : transaction.type === filter
    );
  }, [filter, state.transactions]);

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Fluxo diário"
          title="Lançamentos"
          subtitle="Cadastre receitas, despesas e transferências, e acompanhe o histórico detalhado das movimentações."
        />

        {/* ✅ FORM COM EDIÇÃO */}
        <TransactionForm
          initialType="expense"
          title={editingTransaction ? "Editar lançamento" : "Novo lançamento"}
          submitLabel={editingTransaction ? "Salvar alterações" : "Salvar agora"}
          transactionToEdit={editingTransaction || undefined}
          onSubmitted={() => setEditingTransaction(null)} // limpa após salvar
        />

        <SectionCard
          title="Filtros"
          subtitle="Alterne a visão do histórico conforme o tipo de movimentação."
        >
          <View className="flex-row flex-wrap gap-2">
            {(["all", "income", "expense", "transfer"] as FilterType[]).map((item) => (
              <Chip
                key={item}
                label={labels[item]}
                selected={filter === item}
                onPress={() => setFilter(item)}
              />
            ))}
          </View>
        </SectionCard>

        <SectionCard
          title="Histórico"
          subtitle="Os lançamentos são armazenados localmente e podem ser removidos a qualquer momento."
        >
          <View className="gap-3">
            {filteredTransactions.length === 0 ? (
              <EmptyState
                title="Nenhum lançamento encontrado"
                subtitle="Assim que você registrar sua primeira movimentação, ela aparecerá aqui com categoria, data e valor."
              />
            ) : (
              filteredTransactions.map((transaction) => {
                const category = getCategoryById(transaction.categoryId);

                const amountPrefix =
                  transaction.type === "income"
                    ? "+"
                    : transaction.type === "expense"
                    ? "-"
                    : "";

                const amountColor =
                  transaction.type === "income"
                    ? "text-success"
                    : transaction.type === "expense"
                    ? "text-error"
                    : "text-foreground";

                return (
                  <View
                    key={transaction.id}
                    className="rounded-[24px] border border-border bg-background px-4 py-4"
                  >
                    <View className="flex-row items-start justify-between gap-4">
                      <View className="flex-1 gap-1">
                        <Text className="text-base font-semibold text-foreground">
                          {transaction.title}
                        </Text>

                        <Text className="text-xs leading-5 text-muted">
                          {category?.name ?? "Sem categoria"} · {transaction.date}
                        </Text>

                        {transaction.note ? (
                          <Text className="text-xs leading-5 text-muted">
                            {transaction.note}
                          </Text>
                        ) : null}
                      </View>

                      <View className="items-end gap-2">
                        <Text className={`text-sm font-semibold ${amountColor}`}>
                          {amountPrefix}
                          {formatCurrency(transaction.amount)}
                        </Text>

                        {/* ✅ BOTÕES */}
                        <View className="flex-row gap-3">
                          <Pressable
                            onPress={() => setEditingTransaction(transaction)}
                          >
                            <Text className="text-xs font-semibold text-primary">
                              Editar
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => removeTransaction(transaction.id)}
                          >
                            <Text className="text-xs font-semibold text-error">
                              Excluir
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}