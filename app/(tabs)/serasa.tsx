import { ScrollView, Text, View, Pressable, Alert, TextInput } from "react-native";
import { useState, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useFinance } from "@/lib/finance-store";
import { useColors } from "@/hooks/use-colors";

export default function SerasaScreen() {
  const colors = useColors();
  const { state, addDebt, editDebt, removeDebt } = useFinance();
  const [tab, setTab] = useState<"devendo" | "pagando" | "pago">("devendo");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const filteredDebts = useMemo(
    () => state.debts.filter((debt) => debt.status === tab),
    [state.debts, tab],
  );

  const totalByStatus = useMemo(
    () => ({
      devendo: state.debts
        .filter((d) => d.status === "devendo")
        .reduce((sum, d) => sum + d.amount, 0),
      pagando: state.debts
        .filter((d) => d.status === "pagando")
        .reduce((sum, d) => sum + d.amount, 0),
      pago: state.debts
        .filter((d) => d.status === "pago")
        .reduce((sum, d) => sum + d.amount, 0),
    }),
    [state.debts],
  );

  const handleSave = () => {
    if (!formData.title.trim() || !formData.amount) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    if (editingId) {
      editDebt(editingId, {
        title: formData.title,
        amount: Number(formData.amount),
        dueDate: formData.dueDate,
        description: formData.description,
      });
      setEditingId(null);
    } else {
      addDebt({
        title: formData.title,
        amount: Number(formData.amount),
        dueDate: formData.dueDate,
        status: tab,
        description: formData.description,
      });
    }

    setFormData({
      title: "",
      amount: "",
      dueDate: new Date().toISOString().split("T")[0],
      description: "",
    });
    setShowForm(false);
  };

  const handleEdit = (debtId: string) => {
    const debt = state.debts.find((d) => d.id === debtId);
    if (debt) {
      setFormData({
        title: debt.title,
        amount: String(debt.amount),
        dueDate: debt.dueDate,
        description: debt.description || "",
      });
      setEditingId(debtId);
      setShowForm(true);
    }
  };

  const handleDelete = (debtId: string) => {
    Alert.alert("Deletar débito", "Tem certeza que deseja deletar este débito?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: () => removeDebt(debtId),
      },
    ]);
  };

  const handleStatusChange = (debtId: string, newStatus: "devendo" | "pagando" | "pago") => {
    editDebt(debtId, { status: newStatus });
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Serasa</Text>
            <Text className="text-sm text-muted">Controle seus débitos e pagamentos</Text>
          </View>

          {/* Tabs */}
          <View className="flex-row gap-2">
            {(["devendo", "pagando", "pago"] as const).map((tabName) => (
              <Pressable
                key={tabName}
                onPress={() => setTab(tabName)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor: tab === tabName ? colors.primary : colors.surface,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  className={`text-center font-semibold capitalize ${
                    tab === tabName ? "text-white" : "text-foreground"
                  }`}
                >
                  {tabName === "devendo"
                    ? "Devendo"
                    : tabName === "pagando"
                      ? "Pagando"
                      : "Pago"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Total */}
          <View className="bg-surface rounded-lg p-4">
            <Text className="text-sm text-muted mb-1">Total {tab}</Text>
            <Text className="text-2xl font-bold text-foreground">
              R$ {totalByStatus[tab].toFixed(2)}
            </Text>
          </View>

          {/* Form */}
          {showForm && (
            <View className="bg-surface rounded-lg p-4 gap-3">
              <TextInput
                placeholder="Título do débito"
                placeholderTextColor={colors.muted}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
              <TextInput
                placeholder="Valor"
                placeholderTextColor={colors.muted}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                keyboardType="decimal-pad"
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
              <TextInput
                placeholder="Data de vencimento (YYYY-MM-DD)"
                placeholderTextColor={colors.muted}
                value={formData.dueDate}
                onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
              <TextInput
                placeholder="Descrição (opcional)"
                placeholderTextColor={colors.muted}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                className="bg-background border border-border rounded-lg p-3 text-foreground"
                multiline
              />

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      title: "",
                      amount: "",
                      dueDate: new Date().toISOString().split("T")[0],
                      description: "",
                    });
                  }}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text className="text-center font-semibold text-foreground">Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text className="text-center font-semibold text-white">
                    {editingId ? "Atualizar" : "Adicionar"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Débitos List */}
          <View className="gap-2">
            {filteredDebts.length === 0 ? (
              <View className="bg-surface rounded-lg p-6 items-center">
                <Text className="text-muted text-center">Nenhum débito {tab}</Text>
              </View>
            ) : (
              filteredDebts.map((debt) => (
                <View key={debt.id} className="bg-surface rounded-lg p-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">{debt.title}</Text>
                      <Text className="text-sm text-muted">Vencimento: {debt.dueDate}</Text>
                    </View>
                    <Text className="text-lg font-bold text-primary">R$ {debt.amount.toFixed(2)}</Text>
                  </View>

                  {debt.description && (
                    <Text className="text-sm text-muted mb-2">{debt.description}</Text>
                  )}

                  {/* Status Buttons */}
                  <View className="flex-row gap-2 mb-2">
                    {(["devendo", "pagando", "pago"] as const).map((status) => (
                      <Pressable
                        key={status}
                        onPress={() => handleStatusChange(debt.id, status)}
                        style={({ pressed }) => [
                          {
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 6,
                            backgroundColor:
                              debt.status === status ? colors.primary : colors.border,
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Text
                          className={`text-xs font-semibold capitalize ${
                            debt.status === status ? "text-white" : "text-foreground"
                          }`}
                        >
                          {status === "devendo"
                            ? "Devendo"
                            : status === "pagando"
                              ? "Pagando"
                              : "Pago"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => handleEdit(debt.id)}
                      style={({ pressed }) => [
                        {
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: colors.primary,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text className="text-center text-sm font-semibold text-white">Editar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(debt.id)}
                      style={({ pressed }) => [
                        {
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: colors.error,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text className="text-center text-sm font-semibold text-white">Deletar</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Add Button */}
          {!showForm && (
            <Pressable
              onPress={() => setShowForm(true)}
              style={({ pressed }) => [
                {
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text className="text-center font-semibold text-white">+ Adicionar débito</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
