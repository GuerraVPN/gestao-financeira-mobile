import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useFinance, type EntryType } from "@/lib/finance-store";
import { Chip, FieldLabel, InputField, PrimaryButton } from "@/components/finance/ui";

const typeLabels: Record<EntryType, string> = {
  income: "Receita",
  expense: "Despesa",
  transfer: "Transferência",
};

interface TransactionFormProps {
  initialType?: EntryType;
  title?: string;
  submitLabel?: string;
  onSubmitted?: () => void;
}

export function TransactionForm({
  initialType = "expense",
  title = "Novo lançamento",
  submitLabel = "Salvar lançamento",
  onSubmitted,
}: TransactionFormProps) {
  const { state, addTransaction } = useFinance();
  const [type, setType] = useState<EntryType>(initialType);
  const [entryTitle, setEntryTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(state.accounts[0]?.id ?? "");
  const [destinationAccountId, setDestinationAccountId] = useState(state.accounts[1]?.id ?? state.accounts[0]?.id ?? "");
  const [cardId, setCardId] = useState(state.cards[0]?.id ?? "");
  const [useCard, setUseCard] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const availableCategories = useMemo(
    () => state.categories.filter((category) => (type === "transfer" ? true : category.type === type)),
    [state.categories, type],
  );

  const resolvedCategoryId =
    type === "transfer"
      ? state.categories.find((category) => category.id === "cat-transporte")?.id ?? state.categories[0]?.id ?? ""
      : categoryId || availableCategories[0]?.id || "";

  const handleSubmit = () => {
    const parsedAmount = Number(amount.replace(",", "."));
    if (!parsedAmount || parsedAmount <= 0) return;

    addTransaction({
      type,
      title: entryTitle,
      amount: parsedAmount,
      categoryId: resolvedCategoryId,
      accountId,
      destinationAccountId: type === "transfer" ? destinationAccountId : undefined,
      cardId: type === "expense" && useCard ? cardId : undefined,
      date,
      note,
    });

    setEntryTitle("");
    setAmount("");
    setNote("");
    onSubmitted?.();
  };

  return (
    <View className="gap-4 rounded-[28px] border border-border bg-surface p-5">
      <View className="gap-1">
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        <Text className="text-sm text-muted">Registre movimentações rapidamente sem sair da tela atual.</Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {(["expense", "income", "transfer"] as EntryType[]).map((item) => (
          <Chip key={item} label={typeLabels[item]} selected={type === item} onPress={() => setType(item)} />
        ))}
      </View>

      <View className="gap-3">
        <View>
          <FieldLabel>Título</FieldLabel>
          <InputField value={entryTitle} onChangeText={setEntryTitle} placeholder="Ex.: Mercado do mês" returnKeyType="done" />
        </View>
        <View>
          <FieldLabel>Valor</FieldLabel>
          <InputField value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" returnKeyType="done" />
        </View>
        <View>
          <FieldLabel>Data</FieldLabel>
          <InputField value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" autoCapitalize="none" returnKeyType="done" />
        </View>
      </View>

      {type !== "transfer" ? (
        <View className="gap-2">
          <FieldLabel>Categoria</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {availableCategories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={(categoryId || availableCategories[0]?.id) === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View className="gap-2">
        <FieldLabel>{type === "transfer" ? "Conta de origem" : "Conta"}</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {state.accounts.map((account) => (
            <Chip key={account.id} label={account.name} selected={accountId === account.id} onPress={() => setAccountId(account.id)} />
          ))}
        </View>
      </View>

      {type === "expense" && state.cards.length > 0 ? (
        <View className="gap-2">
          <FieldLabel>Forma de pagamento</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            <Chip label="Conta" selected={!useCard} onPress={() => setUseCard(false)} />
            <Chip label="Cartão" selected={useCard} onPress={() => setUseCard(true)} />
          </View>
          {useCard ? (
            <View className="flex-row flex-wrap gap-2">
              {state.cards.map((card) => (
                <Chip key={card.id} label={card.name} selected={cardId === card.id} onPress={() => setCardId(card.id)} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {type === "transfer" ? (
        <View className="gap-2">
          <FieldLabel>Conta de destino</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {state.accounts
              .filter((account) => account.id !== accountId)
              .map((account) => (
                <Chip
                  key={account.id}
                  label={account.name}
                  selected={destinationAccountId === account.id}
                  onPress={() => setDestinationAccountId(account.id)}
                />
              ))}
          </View>
        </View>
      ) : null}

      <View>
        <FieldLabel>Observação</FieldLabel>
        <InputField value={note} onChangeText={setNote} placeholder="Opcional" returnKeyType="done" />
      </View>

      <PrimaryButton label={submitLabel} onPress={handleSubmit} />
    </View>
  );
}
