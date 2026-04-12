import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Chip, FieldLabel, InputField, PrimaryButton, ProgressBar, ScreenHeader, SectionCard } from "@/components/finance/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance, type FinanceCategory, type FinanceSettings } from "@/lib/finance-store";

const categoryPalette = ["#2F6BFF", "#8B5CF6", "#16A34A", "#F59E0B", "#EF4444", "#EC4899"];
const categoryIcons = ["payments", "restaurant", "home", "directions-car", "health-and-safety", "celebration"];

export default function MoreScreen() {
  const { state, addCategory, addAccount, addCard, addReminder, toggleReminderPaid, updateSettings, formatCurrency } = useFinance();

  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<FinanceCategory["type"]>("expense");
  const [categoryColor, setCategoryColor] = useState(categoryPalette[0]);

  const [accountName, setAccountName] = useState("");
  const [accountKind, setAccountKind] = useState<"bank" | "cash" | "savings">("bank");
  const [accountBalance, setAccountBalance] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [closingDay, setClosingDay] = useState("25");
  const [dueDay, setDueDay] = useState("5");

  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderAmount, setReminderAmount] = useState("");
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().slice(0, 10));

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
    addCategory({
      name: categoryName,
      type: categoryType,
      color: categoryColor,
      icon: categoryIcons[0],
    });
    setCategoryName("");
  };

  const handleAccountSave = () => {
    const parsedBalance = Number(accountBalance.replace(",", ".")) || 0;
    if (!accountName.trim()) return;
    addAccount({ name: accountName, kind: accountKind, balance: parsedBalance });
    setAccountName("");
    setAccountBalance("");
  };

  const handleCardSave = () => {
    const parsedLimit = Number(cardLimit.replace(",", "."));
    if (!cardName.trim() || !parsedLimit) return;
    addCard({
      name: cardName,
      limit: parsedLimit,
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
    });
    setCardName("");
    setCardLimit("");
  };

  const handleReminderSave = () => {
    const parsedAmount = Number(reminderAmount.replace(",", "."));
    if (!reminderTitle.trim() || !parsedAmount) return;
    addReminder({ title: reminderTitle, amount: parsedAmount, dueDate: reminderDate });
    setReminderTitle("");
    setReminderAmount("");
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
            <PrimaryButton label="Salvar categoria" onPress={handleCategorySave} />
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
            <PrimaryButton label="Salvar conta" onPress={handleAccountSave} />
            <View className="gap-3">
              {state.accounts.map((account) => (
                <View key={account.id} className="rounded-[22px] bg-background px-4 py-4">
                  <Text className="text-sm font-semibold text-foreground">{account.name}</Text>
                  <Text className="mt-1 text-xs text-muted">Tipo {account.kind}</Text>
                  <Text className="mt-2 text-sm font-semibold text-foreground">{formatCurrency(account.balance)}</Text>
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
            <PrimaryButton label="Salvar cartão" onPress={handleCardSave} tone="secondary" />
            <View className="gap-3">
              {state.cards.map((card) => {
                const usage = card.limit > 0 ? card.currentBalance / card.limit : 0;
                return (
                  <View key={card.id} className="gap-2 rounded-[22px] bg-background px-4 py-4">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="text-sm font-semibold text-foreground">{card.name}</Text>
                      <Text className="text-sm font-semibold text-foreground">{formatCurrency(card.currentBalance)}</Text>
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
            <PrimaryButton label="Salvar lembrete" onPress={handleReminderSave} />
            <View className="gap-3">
              {state.reminders.map((reminder) => (
                <View key={reminder.id} className="rounded-[22px] bg-background px-4 py-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1 gap-1">
                      <Text className="text-sm font-semibold text-foreground">{reminder.title}</Text>
                      <Text className="text-xs text-muted">Vencimento em {reminder.dueDate}</Text>
                    </View>
                    <Pressable onPress={() => toggleReminderPaid(reminder.id)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                      <Text className={`text-xs font-semibold ${reminder.paid ? "text-success" : "text-primary"}`}>
                        {reminder.paid ? "Pago" : "Marcar pago"}
                      </Text>
                    </Pressable>
                  </View>
                  <Text className="mt-2 text-sm font-semibold text-foreground">{formatCurrency(reminder.amount)}</Text>
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
