// @/components/updates/UpdateStatus.tsx
import { View, Text } from "react-native";

interface Props {
  comparison: number;
  channel: string;
  currentVersion: string;
  latestVersion?: string;
}

export const UpdateStatus = ({ comparison, channel, currentVersion, latestVersion }: Props) => {
  // 1: Atrás (Desatualizado) | -1: À frente (Dev) | 0: Tudo certo
  
  if (comparison === 1) {
    return (
      <View className="items-center gap-2">
        <View className="bg-orange-500/10 px-4 py-1 rounded-full border border-orange-500/20">
          <Text className="text-orange-500 font-bold capitalize">Atualização no {channel} disponível</Text>
        </View>
        <Text className="text-gray-400 text-sm">Sua: {currentVersion} | Disponível: {latestVersion}</Text>
      </View>
    );
  }

  if (comparison === -1) {
    return (
      <View className="items-center gap-2">
        <View className="bg-blue-500/10 px-4 py-1 rounded-full border border-blue-500/20">
          <Text className="text-blue-400 font-bold">Versão de Desenvolvedor</Text>
        </View>
        <Text className="text-gray-400 text-sm">Você está na {currentVersion}, à frente do {channel} ({latestVersion})</Text>
      </View>
    );
  }

  // Padrão: Tudo certo
  return (
    <View className="items-center">
      <View className="bg-green-500/10 px-6 py-2 rounded-full border border-green-500/20">
        <Text className="text-green-500 font-bold">Tudo atualizado!</Text>
      </View>
      <Text className="text-gray-500 text-sm mt-2">Você está na versão mais recente do canal {channel}.</Text>
    </View>
  );
};
