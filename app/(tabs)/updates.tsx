import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Alert } from "react-native";
import Constants from "expo-constants";
import { ScreenContainer } from "@/components/screen-container"; 
import { ScreenHeader, SectionCard, PrimaryButton } from "@/components/finance/ui";
import { compareVersions } from "@/lib/version";
import { UpdateStatus } from "@/components/updates/UpdateStatus";

// --- CONFIGURAÇÃO ---
const GIST_URL = "https://gist.githubusercontent.com/GuerraVPN/0a834a00f9f04c748c774a999c0e4fec/raw/updates.json";

type Channel = "release" | "beta" | "preview";

interface UpdateInfo {
  version: string;
  url: string;
  changes: string[];
}

export default function UpdatesScreen() {
  const [channel, setChannel] = useState<Channel>("release");
  const [loading, setLoading] = useState(false);
  const [updateData, setUpdateData] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState(false);

  const currentVersion = Constants.expoConfig?.version || "0.0.0";

  const checkUpdates = async (selectedChannel: Channel) => {
    setLoading(true);
    setError(false);
    setUpdateData(null);

    try {
      // Adicionando cache busting para garantir que busca a versão nova
      const response = await fetch(`${GIST_URL}?t=${Date.now()}`);
      const data = await response.json();
      
      const info = data.channels[selectedChannel];

      if (info) {
        setUpdateData(info);
      } else {
        Alert.alert("Erro", "Canal não encontrado no servidor.");
      }
    } catch (err) {
      console.error(err);
      setError(true);
      Alert.alert("Erro", "Não foi possível buscar atualizações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUpdates("release");
  }, []);

  const isNewer = updateData && updateData.version !== currentVersion;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 120 }}>
        <ScreenHeader
          eyebrow="Sistema"
          title="Atualizações"
          subtitle={`Versão instalada: ${currentVersion}`}
        />

        {/* Seletor de Canais */}
        <SectionCard title="Canal de atualização">
          <View className="flex-row gap-2 mt-2">
            {(["release", "beta", "preview"] as Channel[]).map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  setChannel(c);
                  checkUpdates(c);
                }}
                className={`flex-1 py-3 rounded-2xl items-center border ${
                  channel === c ? "bg-primary border-primary" : "bg-transparent border-border"
                }`}
              >
                <Text className={`font-semibold capitalize ${channel === c ? "text-white" : "text-gray-300"}`}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Status da Busca */}
        <View className="items-center py-4">
  {loading ? (
        <ActivityIndicator color="#2F6BFF" />
  ) : updateData ? (
        <UpdateStatus comparison={compareVersions(currentVersion, updateData.version)}
        channel={channel}
        currentVersion={currentVersion}
        latestVersion={updateData.version}
    />
  ) : null}
</View>

        {/* Detalhes da Versão e Botão */}
        {updateData && (
          <SectionCard title={`O que há de novo na ${updateData.version}`}>
            <View className="gap-3 mt-2">
              {updateData.changes.map((change, index) => (
                <View key={index} className="flex-row gap-2">
                  <Text className="text-primary">•</Text>
                  {/* CORRIGIDO: Texto mais claro para melhor leitura */}
                  <Text className="text-gray-200 leading-5">{change}</Text>
                </View>
              ))}
              
              <View className="mt-4">
                <PrimaryButton 
                  label={isNewer ? "Instalar Atualização" : "Reinstalar Versão"} 
                  onPress={() => Linking.openURL(updateData.url)}
                  variant={isNewer ? "default" : "outline"}
                />
              </View>
            </View>
          </SectionCard>
        )}

        <TouchableOpacity 
          onPress={() => checkUpdates(channel)}
          className="items-center pt-4"
        >
          <Text className="text-primary font-medium">Verificar novamente</Text>
        </TouchableOpacity>

      </ScrollView>
    </ScreenContainer>
  );
}
