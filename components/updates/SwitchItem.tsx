// @/components/updates/SwitchItem.tsx
import { View, Text, Switch } from "react-native";

interface SwitchItemProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const SwitchItem = ({ label, description, value, onValueChange }: SwitchItemProps) => (
  <View className="flex-row items-center justify-between p-4 bg-background rounded-xl border border-zinc-800 my-2">
    <View className="flex-1 mr-4">
      <Text className="text-foreground font-semibold text-base">{label}</Text>
      <Text className="text-muted text-sm mt-0.5">{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#3f3f46", true: "#2F6BFF" }}
      thumbColor={"#ffffff"}
    />
  </View>
);
