import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function ScreenHeader({ eyebrow, title, subtitle, actionLabel, onActionPress }: ScreenHeaderProps) {
  return (
    <View className="gap-3">
      {eyebrow ? <Text className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{eyebrow}</Text> : null}
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold text-foreground">{title}</Text>
          <Text className="text-sm leading-6 text-muted">{subtitle}</Text>
        </View>
        {actionLabel && onActionPress ? (
          <PrimaryButton label={actionLabel} onPress={onActionPress} compact />
        ) : null}
      </View>
    </View>
  );
}

export function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <View className="rounded-[28px] border border-border bg-surface p-5">
      <View className="mb-4 gap-1">
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-sm leading-5 text-muted">{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function StatCard({ label, value, helper, tone = "default" }: { label: string; value: string; helper: string; tone?: "default" | "positive" | "negative" | "accent" }) {
  const toneClass = {
    default: "bg-surface",
    positive: "bg-success/10",
    negative: "bg-error/10",
    accent: "bg-primary/10",
  }[tone];

  return (
    <View className={`min-h-28 flex-1 rounded-[24px] border border-border p-4 ${toneClass}`}>
      <Text className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{label}</Text>
      <Text className="mt-3 text-2xl font-bold text-foreground">{value}</Text>
      <Text className="mt-2 text-sm text-muted">{helper}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = "#2F6BFF" }: { value: number; color?: string }) {
  const width = `${Math.min(100, Math.max(0, value * 100))}%` as `${number}%`;
  return (
    <View className="h-3 w-full overflow-hidden rounded-full bg-background">
      <View style={{ width, backgroundColor: color }} className="h-3 rounded-full" />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  compact = false,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  compact?: boolean;
  tone?: "primary" | "secondary" | "ghost";
}) {
  const backgroundColor =
    tone === "primary" ? "#2F6BFF" : tone === "secondary" ? "#8B5CF6" : "#E2E8F0";
  const textColor = tone === "ghost" ? "#0F172A" : "#FFFFFF";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          paddingHorizontal: compact ? 14 : 18,
          paddingVertical: compact ? 10 : 14,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={{ color: textColor }} className="text-center text-sm font-semibold">
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryAction,
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text className="text-sm font-semibold text-primary">{label}</Text>
    </Pressable>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text className="mb-2 text-sm font-medium text-foreground">{children}</Text>;
}

export function InputField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#94A3B8"
      className="rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground"
      {...props}
    />
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? "#2F6BFF" : "#FFFFFF",
          borderColor: selected ? "#2F6BFF" : "#E2E8F0",
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={{ color: selected ? "#FFFFFF" : "#0F172A" }} className="text-sm font-medium">
        {label}
      </Text>
    </Pressable>
  );
}

export function ListRow({
  title,
  subtitle,
  value,
  accentColor,
  trailing,
}: {
  title: string;
  subtitle: string;
  value?: string;
  accentColor?: string;
  trailing?: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4 rounded-[22px] border border-border bg-background px-4 py-4">
      <View className="flex-1 flex-row items-center gap-3">
        <View style={{ backgroundColor: accentColor ?? "#E2E8F0" }} className="h-10 w-10 rounded-2xl" />
        <View className="flex-1 gap-1">
          <Text className="text-sm font-semibold text-foreground">{title}</Text>
          <Text className="text-xs leading-5 text-muted">{subtitle}</Text>
        </View>
      </View>
      {trailing ?? (value ? <Text className="text-sm font-semibold text-foreground">{value}</Text> : null)}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="items-center rounded-[28px] border border-dashed border-border bg-background px-6 py-10">
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-6 text-muted">{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryAction: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
