import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Chip, FieldLabel, InputField, PrimaryButton, ProgressBar, ScreenHeader, SectionCard } from "@/components/finance/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance, type FinanceCategory, type FinanceSettings } from "@/lib/finance-store";

const categoryPalette = ["#2F6BFF", "#8B5CF6", "#16A34A", "#F59E0B", "#EF4444", "#EC4899"];
const categoryIcons = ["payments", "restaurant", "home", "directions-car", "health-and-safety", "celebration"];

export default function MoreScreen() {
  const { state, addCategory, editCategory, removeCategory, addAccount, editAccount, removeAccount, addCard, editCard, removeCard, addReminder, editReminder, removeReminder, toggleReminderPaid, updateSettings, formatCurrency } = useFinance();

  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<FinanceCategory["type"]>("expense");
  const [categoryColor, setCategoryColor] = useState(categoryPalette[0]);
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
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  const settingsOptions = useMemo(
    () => [
      { key: "BRL", label: "BRL" },
      { key: "USD", label: "USD" },
      { key: "EUR", label: "EUR" },
    ],
    [],
  );

  const handleCategorySave = () => {
    if (!categoryName.trim()) return;
    if (editingCategoryId) {
      editCategory(editingCategoryId, {
        name: categoryName,
        type: categoryType,
        color: categoryColor,
        icon: categoryIcons[0],
      });
      setEditingCategoryId(null);
    } else {
      addCategory({
        name: categoryName,
        type: categoryType,
        color: categoryColor,
        icon: categoryIcons[0],
      });
    }
    setCategoryName("");
  };

  const handleCategoryEdit = (category: FinanceCategory) => {
    setCategoryName(category.name);
    setCategoryType(category.type);
    setCategoryColor(category.color);
    setEditingCategoryId(category.id);
  };

  const handleCategoryDelete = (categoryId: string) => {
    removeCategory(categoryId);
    if (editingCategoryId === categoryId) {
      setEditingCategoryId(null);
      setCategoryName("");
    }
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
    setAccountName("");
    setAccountBalance("");
  };

  const handleAccountEdit = (account: typeof state.accounts[0]) => {
    setAccountName(account.name);
    setAccountKind(account.kind);
    setAccountBalance(account.balance.toString());
    setEditingAccountId(account.id);
  };

  const handleAccountDelete = (accountId: string) => {
    removeAccount(accountId);
    if (editingAccountId === accountId) {
      setEditingAccountId(null);
      setAccountName("");
      setAccountBalance("");
    }
  };

  const handleCardSave = () => {
    const parsedLimit = Number(cardLimit.replace(",", "."));
    if (!cardName.trim() || !parsedLimit) return;
    if (editingCardId) {
      editCard(editingCardId, {
        name: cardName,
        limit: parsedLimit,
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
      });
      setEditingCardId(null);
    } else {
      addCard({
        name: cardName,
        limit: parsedLimit,
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
      });
    }
    setCardName("");
    setCardLimit("");
  };

  const handleCardEdit = (card: typeof state.cards[0]) => {
    setCardName(card.name);
    setCardLimit(card.limit.toString());
    setClosingDay(card.closingDay.toString());
    setDueDay(card.dueDay.toString());
    setEditingCardId(card.id);
  };

  const handleCardDelete = (cardId: string) => {
    removeCard(cardId);
    if (editingCardId === cardId) {
      setEditingCardId(null);
      setCardName("");
      setCardLimit("");
    }
  };

  const handleReminderSave = () => {
    const parsedAmount = Number(reminderAmount.replace(",", "."));
    if (!reminderTitle.trim() || !parsedAmount) return;
    if (editingReminderId) {
      editReminder(editingReminderId, { title: reminderTitle, amount: parsedAmount, dueDate: reminderDate });
      setEditingReminderId(null);
    } else {
      addReminder({ title: reminderTitle, amount: parsedAmount, dueDate: reminderDate });
    }
    setReminderTitle("");
    setReminderAmount("");
  };

  const handleReminderEdit = (reminder: typeof state.reminders[0]) => {
    setReminderTitle(reminder.title);
    setReminderAmount(reminder.amount.toString());
    setReminderDate(reminder.dueDate);
    setEditingReminderId(reminder.id);
  };

  const handleReminderDelete = (reminderId: string) => {
    removeReminder(reminderId);
    if (editingReminderId === reminderId) {
      setEditingReminderId(null);
      setReminderTitle("");
      setReminderAmount("");
    }
  };

  const handleCurrencyChange = (currency: FinanceSettings["currency"]) => {
    updateSettings({ currency });
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Configurações e estrutura"
          title="Mais opções"
          subtitle="Administre categorias, contas, cartões, lembretes e preferências sem depender de um backend nesta primeira versão."
        />

        <SectionCard title="Nova categoria" subtitle="Crie categorias personalizadas para refletir sua realidade financeira com mais precisão.">
          <View className="gap-3">
            <View>
              <FieldLabel>Nome</FieldLabel>
              <InputField value={categoryName} onChangeText={setCategoryName} placeholder="Ex.: Educação" returnKeyType="done" />
            </View>
            <View className="gap-2">
              <FieldLabel>Tipo</FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                <Chip label="Despesa" selected={categoryType === "expense"} onPress={() => setCategoryType("expense")} />
                <Chip label="Receita" selected={categoryType === "income"} onPress={() => setCategoryType("income")} />
              </View>
            </View>
            <View className="gap-2">
              <FieldLabel>Cor</FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                {categoryPalette.map((color) => (
                  <Pressable key={color} onPress={() => setCategoryColor(color)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                    <View
                      style={{ backgroundColor: color, borderWidth: categoryColor === color ? 3 : 0, borderColor: "#0F172A" }}
                      className="h-10 w-10 rounded-full"
                    />
                  </Pressable>
                ))}
              </View>
            </View>
            <PrimaryButton label={editingCategoryId ? "Atualizar categoria" : "Salvar categoria"} onPress={handleCategorySave} />
          </View>
        </SectionCard>

        <SectionCard title="Contas" subtitle="Cadastre conta corrente, carteira e reserva para acompanhar onde está o seu dinheiro.">
          <View className="gap-3">
            <View>
              <FieldLabel>Nome da conta</FieldLabel>
              <InputField value={accountName} onChangeText={setAccountName} placeholder="Ex.: Banco digital" returnKeyType="done" />
            </View>
            <View className="gap-2">
              <FieldLabel>Tipo</FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                <Chip label="Conta" selected={accountKind === "bank"} onPress={() => setAccountKind("bank")} />
                <Chip label="Carteira" selected={accountKind === "cash"} onPress={() => setAccountKind("cash")} />
                <Chip label="Reserva" selected={accountKind === "savings"} onPress={() => setAccountKind("savings")} />
              </View>
            </View>
            <View>
              <FieldLabel>Saldo inicial</FieldLabel>
              <InputField value={accountBalance} onChangeText={setAccountBalance} keyboardType="decimal-pad" placeholder="0,00" returnKeyType="done" />
            </View>
            <PrimaryButton label={editingAccountId ? "Atualizar conta" : "Salvar conta"} onPress={handleAccountSave} />
            <View className="gap-3">
              {state.accounts.map((account) => (
                <View key={account.id} className="rounded-[22px] bg-background px-4 py-4">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">{account.name}</Text>
                      <Text className="mt-1 text-xs text-muted">Tipo {account.kind}</Text>
                      <Text className="mt-2 text-sm font-semibold text-foreground">{formatCurrency(account.balance)}</Text>
                    </View>
                    <View className="flex-row gap-1">
                      <PrimaryButton label="Editar" onPress={() => handleAccountEdit(account)} />
                      <PrimaryButton label="Deletar" onPress={() => handleAccountDelete(account.id)} tone="secondary" />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Cartões" subtitle="Controle o limite total, o uso atual e o ciclo de fechamento das faturas cadastradas.">
          <View className="gap-3">
            <View>
              <FieldLabel>Nome do cartão</FieldLabel>
              <InputField value={cardName} onChangeText={setCardName} placeholder="Ex.: Cartão principal" returnKeyType="done" />
            </View>
            <View>
              <FieldLabel>Limite</FieldLabel>
              <InputField value={cardLimit} onChangeText={setCardLimit} keyboardType="decimal-pad" placeholder="0,00" returnKeyType="done" />
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldLabel>Fechamento</FieldLabel>
                <InputField value={closingDay} onChangeText={setClosingDay} keyboardType="number-pad" placeholder="25" returnKeyType="done" />
              </View>
              <View className="flex-1">
                <FieldLabel>Vencimento</FieldLabel>
                <InputField value={dueDay} onChangeText={setDueDay} keyboardType="number-pad" placeholder="5" returnKeyType="done" />
              </View>
            </View>
            <PrimaryButton label={editingCardId ? "Atualizar cartão" : "Salvar cartão"} onPress={handleCardSave} tone="secondary" />
            <View className="gap-3">
              {state.cards.map((card) => {
                const usage = card.limit > 0 ? card.currentBalance / card.limit : 0;
                return (
                  <View key={card.id} className="gap-2 rounded-[22px] bg-background px-4 py-4">
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{card.name}</Text>
                        <Text className="text-sm font-semibold text-foreground">{formatCurrency(card.currentBalance)}</Text>
                      </View>
                      <View className="flex-row gap-1">
                        <PrimaryButton label="Editar" onPress={() => handleCardEdit(card)} />
                        <PrimaryButton label="Deletar" onPress={() => handleCardDelete(card.id)} tone="secondary" />
                      </View>
                    </View>
                    <ProgressBar value={usage} color="#F59E0B" />
                    <Text className="text-xs leading-5 text-muted">
                      Limite de {formatCurrency(card.limit)} · fecha no dia {card.closingDay} · vence no dia {card.dueDay}.
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Planejamento" subtitle="Cadastre próximos pagamentos e marque compromissos como concluídos quando necessário.">
          <View className="gap-3">
            <View>
              <FieldLabel>Título</FieldLabel>
              <InputField value={reminderTitle} onChangeText={setReminderTitle} placeholder="Ex.: Aluguel" returnKeyType="done" />
            </View>
            <View>
              <FieldLabel>Valor</FieldLabel>
              <InputField value={reminderAmount} onChangeText={setReminderAmount} keyboardType="decimal-pad" placeholder="0,00" returnKeyType="done" />
            </View>
            <View>
              <FieldLabel>Vencimento</FieldLabel>
              <InputField value={reminderDate} onChangeText={setReminderDate} placeholder="AAAA-MM-DD" autoCapitalize="none" returnKeyType="done" />
            </View>
            <PrimaryButton label={editingReminderId ? "Atualizar lembrete" : "Salvar lembrete"} onPress={handleReminderSave} tone="secondary" />
            <View className="gap-3">
              {state.reminders.map((reminder) => (
                <View key={reminder.id} className="rounded-[22px] bg-background px-4 py-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1 gap-1">
                      <Text className="text-sm font-semibold text-foreground">{reminder.title}</Text>
                      <Text className="text-xs text-muted">Vencimento em {reminder.dueDate}</Text>
                    </View>
                    <View className="flex-row gap-1">
                      <Pressable onPress={() => toggleReminderPaid(reminder.id)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                        <Text className={`text-xs font-semibold ${reminder.paid ? "text-success" : "text-primary"}`}>
                          {reminder.paid ? "Pago" : "Marcar"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-foreground">{formatCurrency(reminder.amount)}</Text>
                    <View className="flex-row gap-1">
                      <PrimaryButton label="Editar" onPress={() => handleReminderEdit(reminder)} />
                      <PrimaryButton label="Deletar" onPress={() => handleReminderDelete(reminder.id)} tone="secondary" />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Preferências" subtitle="Ajuste a moeda, as notificações locais futuras e a forma de exibição dos valores.">
          <View className="gap-4">
            <View className="gap-2">
              <FieldLabel>Moeda principal</FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                {settingsOptions.map((option) => (
                  <Chip
                    key={option.key}
                    label={option.label}
                    selected={state.settings.currency === option.key}
                    onPress={() => handleCurrencyChange(option.key as FinanceSettings["currency"])}
                  />
                ))}
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <Chip
                label={state.settings.notificationsEnabled ? "Notificações ativas" : "Ativar notificações"}
                selected={state.settings.notificationsEnabled}
                onPress={() => updateSettings({ notificationsEnabled: !state.settings.notificationsEnabled })}
              />
              <Chip
                label={state.settings.showCents ? "Mostrar centavos" : "Ocultar centavos"}
                selected={state.settings.showCents}
                onPress={() => updateSettings({ showCents: !state.settings.showCents })}
              />
            </View>
          </View>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
