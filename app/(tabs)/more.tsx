import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { 
  Chip, 
  FieldLabel, 
  InputField, 
  PrimaryButton, 
  ScreenHeader, 
  SectionCard 
} from "@/components/finance/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance, type FinanceCategory } from "@/lib/finance-store";

const categoryPalette = ["#2F6BFF", "#8B5CF6", "#16A34A", "#F59E0B", "#EF4444", "#EC4899"];

// Função utilitária para tradução visual
const translateType = (type: string) => (type === "income" ? "Receita" : "Despesa");

export default function MoreScreen() {
  const { 
    state, addCategory, editCategory, removeCategory, 
    addAccount, editAccount, removeAccount, 
    addCard, editCard, removeCard, 
    addReminder, editReminder, removeReminder, toggleReminderPaid, 
    formatCurrency 
  } = useFinance();

  // --- ESTADOS ---
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<FinanceCategory["type"]>("expense");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [accountName, setAccountName] = useState("");
  const [accountKind, setAccountKind] = useState<"bank" | "cash" | "savings">("bank");
  const [accountBalance, setAccountBalance] = useState("");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const [cardName, setCardName] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [closingDay, setClosingDay] = useState("25");
  const [dueDay, setDueDay] = useState("5");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderAmount, setReminderAmount] = useState("");
  const [reminderDueDate, setReminderDueDate] = useState("");
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  const [backupJson, setBackupJson] = useState<string | null>(null);
  const [importJson, setImportJson] = useState("");

  // ✅ CÁLCULO AVANÇADO DE CONTAS (PROJEÇÃO)
  const accountsWithProjectedBalance = useMemo(() => {
    const now = new Date();
    const accounts = state?.accounts ?? [];
    const transactions = state?.transactions ?? [];

    return accounts.map(account => {
      // Filtrar transações futuras desta conta
      const futureTransactions = transactions.filter(t => 
        t.accountId === account.id && new Date(t.date) > now
      );

      // Calcular o impacto futuro (o que ainda vai sair ou entrar)
      const futureImpact = futureTransactions.reduce((sum, t) => {
        return t.type === "income" ? sum + t.amount : sum - t.amount;
      }, 0);

      return {
        ...account,
        displayBalance: (account.balance || 0) - futureImpact
      };
    });
  }, [state.accounts, state.transactions]);

  // --- HANDLERS ---
  const handleCategorySave = () => {
    if (!categoryName.trim()) return;
    if (editingCategoryId) {
      editCategory(editingCategoryId, { name: categoryName, type: categoryType, color: categoryPalette[0] });
      setEditingCategoryId(null);
    } else {
      addCategory({ name: categoryName, type: categoryType, color: categoryPalette[0], icon: "tag" });
    }
    setCategoryName("");
  };

  const handleAccountSave = () => {
    const parsedBalance = Number(accountBalance.replace(",", ".")) || 0;
    if (!accountName.trim()) return;
    if (editingAccountId) {
      editAccount(editingAccountId, { name: accountName, kind: accountKind, balance: parsedBalance });
      setEditingAccountId(null);
    } else {
      addAccount({ name: accountName, kind: accountKind, balance: parsedBalance });
    }
    setAccountName(""); setAccountBalance("");
  };

  const handleCardSave = () => {
    const parsedLimit = Number(cardLimit.replace(",", "."));
    if (!cardName.trim() || !parsedLimit) return;
    if (editingCardId) {
      editCard(editingCardId, { name: cardName, limit: parsedLimit, closingDay: Number(closingDay), dueDay: Number(dueDay) });
      setEditingCardId(null);
    } else {
      addCard({ name: cardName, limit: parsedLimit, closingDay: Number(closingDay), dueDay: Number(dueDay) });
    }
    setCardName(""); setCardLimit("");
  };

  const handleReminderSave = () => {
    const parsedAmount = Number(reminderAmount.replace(",", "."));
    if (!reminderTitle.trim() || parsedAmount <= 0 || !reminderDueDate.trim()) return;
    if (editingReminderId) {
      editReminder(editingReminderId, { title: reminderTitle, amount: parsedAmount, dueDate: reminderDueDate });
      setEditingReminderId(null);
    } else {
      addReminder({ title: reminderTitle, amount: parsedAmount, dueDate: reminderDueDate });
    }
    setReminderTitle(""); setReminderAmount(""); setReminderDueDate("");
  };

  // --- BACKUP ---
  const handleExport = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const stores = await AsyncStorage.multiGet(keys);
    const data = stores.reduce((acc, [key, value]) => { acc[key] = value; return acc; }, {} as any);
    setBackupJson(JSON.stringify(data, null, 2));
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      await AsyncStorage.multiSet(Object.entries(parsed).map(([k, v]) => [k, String(v)]));
      Alert.alert("Sucesso", "Dados importados. Reinicie o App.");
    } catch { Alert.alert("Erro", "JSON Inválido"); }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        <ScreenHeader
          eyebrow="Configurações e estrutura"
          title="Mais opções"
          subtitle="Administre categorias, contas, cartões e backups locais."
        />

        {/* CATEGORIAS - Traduzido */}
        <SectionCard title="Categorias" subtitle="Organize suas receitas e despesas.">
          <View className="gap-3">
            <InputField value={categoryName} onChangeText={setCategoryName} placeholder="Nome da categoria" />
            <View className="flex-row gap-2">
              <Chip label="Despesa" selected={categoryType === "expense"} onPress={() => setCategoryType("expense")} />
              <Chip label="Receita" selected={categoryType === "income"} onPress={() => setCategoryType("income")} />
            </View>
            <PrimaryButton label={editingCategoryId ? "Atualizar categoria" : "Salvar categoria"} onPress={handleCategorySave} />
            
            <View className="gap-2 mt-4">
              {state.categories.map((cat) => (
                <View key={cat.id} className="flex-row items-center justify-between bg-background p-3 rounded-xl border border-zinc-800">
                  <Text className="text-foreground font-medium">{cat.name} ({translateType(cat.type)})</Text>
                  <View className="flex-row gap-2">
                    <PrimaryButton label="Editar" onPress={() => { setCategoryName(cat.name); setCategoryType(cat.type); setEditingCategoryId(cat.id); }} />
                    <PrimaryButton label="Deletar" onPress={() => removeCategory(cat.id)} tone="secondary" />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </SectionCard>

        {/* CONTAS - Cálculo Avançado */}
        <SectionCard title="Contas" subtitle="Gerencie seus saldos.">
          <View className="gap-3">
            <View>
              <FieldLabel>Nome da conta</FieldLabel>
              <InputField value={accountName} onChangeText={setAccountName} placeholder="Ex.: Banco digital" />
            </View>
            <View className="gap-2">
              <FieldLabel>Tipo</FieldLabel>
              <View className="flex-row gap-2">
                <Chip label="Conta" selected={accountKind === "bank"} onPress={() => setAccountKind("bank")} />
                <Chip label="Carteira" selected={accountKind === "cash"} onPress={() => setAccountKind("cash")} />
                <Chip label="Reserva" selected={accountKind === "savings"} onPress={() => setAccountKind("savings")} />
              </View>
            </View>
            <View>
              <FieldLabel>Saldo Inicial</FieldLabel>
              <InputField value={accountBalance} onChangeText={setAccountBalance} keyboardType="decimal-pad" placeholder="0,00" />
            </View>
            <PrimaryButton label={editingAccountId ? "Atualizar conta" : "Salvar conta"} onPress={handleAccountSave} />
            
            <View className="gap-3 mt-4">
              {accountsWithProjectedBalance.map((account) => (
                <View key={account.id} className="rounded-[22px] bg-background px-4 py-4 border border-zinc-800">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">{account.name}</Text>
                      <Text className="text-xs text-muted">Tipo {account.kind}</Text>
                      <Text className="mt-1 text-sm font-bold text-foreground">{formatCurrency(account.displayBalance)}</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <PrimaryButton label="Editar" onPress={() => { setAccountName(account.name); setAccountKind(account.kind); setAccountBalance(account.balance.toString()); setEditingAccountId(account.id); }} />
                      <PrimaryButton label="Deletar" onPress={() => removeAccount(account.id)} tone="secondary" />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </SectionCard>

        {/* CARTÕES */}
        <SectionCard title="Cartões" subtitle="Controle o limite total.">
          <View className="gap-3">
            <InputField value={cardName} onChangeText={setCardName} placeholder="Nome do cartão" />
            <InputField value={cardLimit} onChangeText={setCardLimit} keyboardType="decimal-pad" placeholder="Limite" />
            <View className="flex-row gap-3">
              <View className="flex-1"><InputField value={closingDay} onChangeText={setClosingDay} placeholder="Fechamento" keyboardType="number-pad" /></View>
              <View className="flex-1"><InputField value={dueDay} onChangeText={setDueDay} placeholder="Vencimento" keyboardType="number-pad" /></View>
            </View>
            <PrimaryButton label={editingCardId ? "Atualizar cartão" : "Salvar cartão"} onPress={handleCardSave} />
            
            <View className="gap-3 mt-4">
              {state.cards.map((card) => (
                <View key={card.id} className="rounded-[22px] bg-background px-4 py-4 border border-zinc-800">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">{card.name}</Text>
                      <Text className="text-muted text-sm">{formatCurrency(card.currentBalance)} / {formatCurrency(card.limit)}</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <PrimaryButton label="Editar" onPress={() => { setCardName(card.name); setCardLimit(card.limit.toString()); setEditingCardId(card.id); }} />
                      <PrimaryButton label="Deletar" onPress={() => removeCard(card.id)} tone="secondary" />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </SectionCard>

        {/* BACKUP */}
        <SectionCard title="Backup" subtitle="Exporte ou importe seus dados.">
          <View className="gap-3">
            <PrimaryButton label="Gerar Backup JSON" onPress={handleExport} />
            {backupJson && (
              <View className="gap-2">
                <ScrollView className="max-h-32 bg-zinc-900 p-2 rounded-lg">
                  <Text className="text-[10px] text-green-500 font-mono">{backupJson}</Text>
                </ScrollView>
                <PrimaryButton label="Copiar Código" onPress={() => Clipboard.setStringAsync(backupJson)} tone="secondary" />
              </View>
            )}
            <InputField value={importJson} onChangeText={setImportJson} placeholder="Cole seu JSON aqui..." multiline />
            <PrimaryButton label="Importar Dados" onPress={handleImport} tone="secondary" />
          </View>
        </SectionCard>

      </ScrollView>
    </ScreenContainer>
  );
}