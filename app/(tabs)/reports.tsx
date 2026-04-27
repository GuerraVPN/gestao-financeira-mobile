import { useState, useMemo } from "react";
import { ScrollView, Text, View, Alert, TouchableOpacity } from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { ProgressBar, ScreenHeader, SectionCard, StatCard, PrimaryButton } from "@/components/finance/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-store";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function ReportsScreen() {
  const { state, getCategoryById, formatCurrency } = useFinance();
  const colors = useColors();
  
  const [selectedDate, setSelectedDate] = useState(new Date());

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const monthName = `${months[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`;

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1);
    setSelectedDate(newDate);
  };

  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === selectedDate.getMonth() && 
             tDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [state.transactions, selectedDate]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredTransactions]);

  const { income, expense, net } = useMemo(() => {
    const inc = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income: inc, expense: exp, net: inc - exp };
  }, [filteredTransactions]);

  const categoryReport = useMemo(() => {
    const grouped = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.categoryId] = (acc[t.categoryId] ?? 0) + t.amount;
        return acc;
      }, {});

    return Object.entries(grouped)
      .map(([id, amount]) => ({ category: getCategoryById(id), amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, getCategoryById]);

  const totalReportedExpenses = categoryReport.reduce((sum, item) => sum + item.amount, 0);

  // --- FUNÇÃO DE PDF CORRIGIDA ---
  const generatePDF = async () => {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { color: #2F6BFF; margin-bottom: 5px; }
            .header-info { margin-bottom: 20px; border-bottom: 2px solid #EEE; padding-bottom: 10px; }
            .section-title { background: #F4F7FF; padding: 8px; margin-top: 20px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; border-bottom: 1px solid #CCC; padding: 8px; font-size: 14px; }
            td { padding: 8px; border-bottom: 1px dashed #EEE; font-size: 13px; }
            .income { color: #00C851; font-weight: bold; }
            .expense { color: #FF4444; font-weight: bold; }
            .total-row { background: #FAFAFA; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h1>Relatório Financeiro</h1>
            <p>Período: <b>${monthName}</b></p>
          </div>

          <div class="section-title"><h3>Resumo do Mês</h3></div>
          <table>
            <tr><td>Receitas</td><td class="income">${formatCurrency(income)}</td></tr>
            <tr><td>Despesas</td><td class="expense">${formatCurrency(expense)}</td></tr>
            <tr class="total-row"><td>Saldo Líquido</td><td>${formatCurrency(net)}</td></tr>
          </table>

          <div class="section-title"><h3>Despesas por Categoria</h3></div>
          <table>
            <thead>
              <tr><th>Categoria</th><th>Valor</th><th>%</th></tr>
            </thead>
            <tbody>
              ${categoryReport.map(item => `
                <tr>
                  <td>${item.category?.name || 'Outros'}</td>
                  <td>${formatCurrency(item.amount)}</td>
                  <td>${totalReportedExpenses > 0 ? ((item.amount / totalReportedExpenses) * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title"><h3>Histórico de Lançamentos</h3></div>
          <table>
            <thead>
              <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr>
            </thead>
            <tbody>
              ${sortedTransactions.map(t => {
                const cat = getCategoryById(t.categoryId);
                const date = new Date(t.date);
                const isExp = t.type === 'expense';
                return `
                  <tr>
                    <td>${date.getDate()}/${date.getMonth() + 1}</td>
                    <td>${t.description || t.title || 'Sem nome'}</td>
                    <td>${cat?.name || '-'}</td>
                    <td class="${isExp ? 'expense' : 'income'}">
                      ${isExp ? '-' : '+'}${formatCurrency(t.amount)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível exportar o PDF.");
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Relatórios" subtitle="Análise detalhada do seu dinheiro." />

        {/* Seletor de Mês */}
        <View className="flex-row items-center justify-between bg-card rounded-[24px] border border-border p-2">
          <TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 10 }}>
            <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{monthName}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 10 }}>
            <IconSymbol name="chevron.right" size={24} color={colors.tint} />
          </TouchableOpacity>
        </View>

        <SectionCard title="Ações">
          <PrimaryButton label={`Exportar PDF de ${months[selectedDate.getMonth()]}`} onPress={generatePDF} />
        </SectionCard>

        <View className="flex-row gap-4">
          <StatCard label="Receitas" value={formatCurrency(income)} tone="positive" />
          <StatCard label="Despesas" value={formatCurrency(expense)} tone="negative" />
        </View>

        <SectionCard title="Gastos por Categoria">
          {categoryReport.length === 0 ? (
            <Text style={{ color: colors.muted, textAlign: 'center', padding: 20 }}>Nenhuma despesa registrada.</Text>
          ) : (
            categoryReport.map((item) => (
              <View key={item.category?.id} className="mb-4">
                <View className="flex-row justify-between mb-1">
                  <Text style={{ color: colors.text, fontWeight: '500' }}>{item.category?.name}</Text>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{formatCurrency(item.amount)}</Text>
                </View>
                <ProgressBar value={item.amount / totalReportedExpenses} color={item.category?.color} />
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard title="Lançamentos do Mês">
          <View className="gap-3">
            {sortedTransactions.length === 0 ? (
              <Text style={{ color: colors.muted, textAlign: 'center', padding: 20 }}>Nada para mostrar aqui.</Text>
            ) : (
              sortedTransactions.map((t) => {
                const category = getCategoryById(t.categoryId);
                const isExpense = t.type === 'expense';
                const tDate = new Date(t.date);
                const displayName = t.description || t.title || category?.name || "Lançamento";

                return (
                  <View key={t.id} className="flex-row items-center justify-between p-4 bg-background border border-border rounded-[20px]">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View style={{ backgroundColor: category?.color || colors.muted, width: 10, height: 10, borderRadius: 5 }} />
                      <View className="flex-1">
                        <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>{displayName}</Text>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>Dia {tDate.getDate()} • {category?.name}</Text>
                      </View>
                    </View>
                    <Text style={{ color: isExpense ? "#FF4444" : "#00C851", fontWeight: 'bold', fontSize: 14, marginLeft: 8 }}>
                      {isExpense ? "-" : "+"}{formatCurrency(t.amount)}
                    </Text>
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