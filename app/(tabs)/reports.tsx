import { ScrollView, Text, View, Alert } from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { ProgressBar, ScreenHeader, SectionCard, StatCard, PrimaryButton } from "@/components/finance/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-store";

export default function ReportsScreen() {
  const { state, monthlyIncome, monthlyExpense, monthlyNet, totalBalance, totalCardUsage, getCategoryById, formatCurrency } = useFinance();

  // --- Lógica de Dados ---
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

  // --- Função de Exportação PDF ---
  const generatePDF = async () => {
    // Conteúdo HTML do Relatório
    const htmlContent = `
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" /></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #2F6BFF;">Relatório Financeiro</h1>
          <p>Data: ${new Date().toLocaleDateString()}</p>
          <hr/>
          <h3>Resumo Mensal</h3>
          <p>Receitas: ${formatCurrency(monthlyIncome)}</p>
          <p>Despesas: ${formatCurrency(monthlyExpense)}</p>
          <p>Saldo: ${formatCurrency(monthlyNet)}</p>
          
          <h3>Despesas por Categoria</h3>
          ${categoryReport.map(item => `
            <div style="margin-bottom: 5px;">
              <b>${item.category?.name ?? "Outros"}:</b> ${formatCurrency(item.amount)}
            </div>
          `).join('')}
        </body>
      </html>
    `;

    try {
      // Cria o arquivo temporário
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Abre o menu nativo de compartilhamento (onde o usuário escolhe onde salvar)
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Exportar Relatório',
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
      console.error(error);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Análise"
          title="Relatórios"
          subtitle="Entenda a distribuição das despesas e o seu saldo."
        />

        {/* Botão de Exportar */}
        <SectionCard title="Ações">
          <PrimaryButton label="Exportar Relatório (PDF)" onPress={generatePDF} />
        </SectionCard>

        <View className="gap-4">
          <View className="flex-row gap-4">
            <StatCard label="Receitas" value={formatCurrency(monthlyIncome)} helper="Entradas do mês." tone="positive" />
            <StatCard label="Despesas" value={formatCurrency(monthlyExpense)} helper="Saídas do mês." tone="negative" />
          </View>
          <View className="flex-row gap-4">
            <StatCard label="Resultado" value={formatCurrency(monthlyNet)} helper="Diferença." tone="accent" />
            <StatCard label="Saldo" value={formatCurrency(totalBalance)} helper="Soma das contas." />
          </View>
        </View>

        <SectionCard title="Despesas por categoria">
          <View className="gap-4">
            {categoryReport.map((item) => {
              const share = totalReportedExpenses > 0 ? item.amount / totalReportedExpenses : 0;
              return (
                <View key={item.category?.id ?? item.amount} className="gap-2 rounded-[24px] border border-border bg-background px-4 py-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-sm font-semibold text-foreground">{item.category?.name ?? "Categoria"}</Text>
                    <Text className="text-sm font-semibold text-foreground">{formatCurrency(item.amount)}</Text>
                  </View>
                  <ProgressBar value={share} color={item.category?.color ?? "#2F6BFF"} />
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Contas e cartões">
          <View className="gap-4">
            {state.accounts.map((account) => (
              <View key={account.id} className="rounded-[24px] border border-border bg-background px-4 py-4">
                <Text className="text-sm font-semibold text-foreground">{account.name}</Text>
                <Text className="text-lg font-semibold text-foreground">{formatCurrency(account.balance)}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
