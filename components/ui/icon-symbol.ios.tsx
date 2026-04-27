import { MaterialIcons } from "@expo/vector-icons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "list.bullet.rectangle.portrait.fill": "receipt-long",
  "chart.bar.doc.horizontal.fill": "bar-chart",
  "chart.pie.fill": "pie-chart",
  "square.grid.2x2.fill": "apps",
  "plus.circle.fill": "add-circle",
  "creditcard.fill": "credit-card",
  "wallet.pass.fill": "account-balance-wallet",
  "flag.checkered.circle.fill": "flag-circle",
  "calendar.badge.clock": "event",
  "slider.horizontal.3": "tune",
  "exclamationmark.triangle.fill": "warning",
  "rocket.fill": "rocket-launch",
} as const;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: SymbolViewProps["name"];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const materialName = MAPPING[name] ?? "help-outline";

  return <MaterialIcons color={color} size={size} name={materialName} style={style} />;
}
