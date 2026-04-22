import { Tabs } from "expo-router";
import { Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react"; // Importação nova
import messaging from '@react-native-firebase/messaging'; // Importação nova
import AsyncStorage from "@react-native-async-storage/async-storage"; // Importação nova

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  // --- INÍCIO DA LÓGICA DE NOTIFICAÇÕES ---
  useEffect(() => {
    async function setupNotifications() {
      // 1. Pede permissão para o Android
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // 2. Inscreve no tópico do canal salvo (ou 'release' se for a primeira vez)
        const savedChannel = await AsyncStorage.getItem("@selected_channel") || "release";
        await messaging().subscribeToTopic(savedChannel);
        console.log("Inscrito no tópico:", savedChannel);
      }
    }

    setupNotifications();

    // 3. Escuta a notificação enquanto o app está aberto
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || "Nova atualização!",
        remoteMessage.notification?.body
      );
    });

    return unsubscribe;
  }, []);
  // --- FIM DA LÓGICA DE NOTIFICAÇÕES ---

  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Lançamentos",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="list.bullet.rectangle.portrait.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Orçamentos",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.doc.horizontal.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Relatórios",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.pie.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="serasa"
        options={{
          title: "Serasa",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="exclamationmark.triangle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Mais",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="square.grid.2x2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: "Atualizações",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="cloud-download-outline" color={color} />
        }}
      />
    </Tabs>
  );
}
