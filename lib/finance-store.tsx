import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type EntryType = "income" | "expense" | "transfer";
export type PaymentSourceType = "account" | "card";

export interface FinanceTransaction {
  id: string;
  type: EntryType;
  title: string;
  amount: number;
  categoryId: string;
  accountId?: string;
  destinationAccountId?: string;
  cardId?: string;
  date: string;
  note?: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  kind: "bank" | "cash" | "savings";
  balance: number;
}

export interface FinanceCard {
  id: string;
  name: string;
  limit: number;
  currentBalance: number;
  closingDay: number;
  dueDay: number;
}

export interface FinanceBudget {
  id: string;
  categoryId: string;
  amount: number;
  month: string;
}

export interface FinanceGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface FinanceReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  paid: boolean;
}

export interface FinanceDebt {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "devendo" | "pagando" | "pago";
  description?: string;
}

export interface FinanceSettings {
  currency: "BRL" | "USD" | "EUR";
  notificationsEnabled: boolean;
  showCents: boolean;
}

export interface FinanceState {
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  cards: FinanceCard[];
  budgets: FinanceBudget[];
  goals: FinanceGoal[];
  reminders: FinanceReminder[];
  debts: FinanceDebt[];
  settings: FinanceSettings;
}

interface NewTransactionInput {
  type: EntryType;
  title: string;
  amount: number;
  categoryId: string;
  accountId?: string;
  destinationAccountId?: string;
  cardId?: string;
  date?: string;
  note?: string;
}

interface FinanceContextValue {
  state: FinanceState;
  loading: boolean;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  totalBalance: number;
  totalCardUsage: number;
  upcomingReminders: FinanceReminder[];
  addTransaction: (input: NewTransactionInput) => void;
  removeTransaction: (transactionId: string) => void;
  addCategory: (input: Omit<FinanceCategory, "id">) => void;
  addBudget: (input: Omit<FinanceBudget, "id" | "month"> & { month?: string }) => void;
  addGoal: (input: Omit<FinanceGoal, "id">) => void;
  addAccount: (input: Omit<FinanceAccount, "id">) => void;
  addCard: (input: Omit<FinanceCard, "id" | "currentBalance">) => void;
  addReminder: (input: Omit<FinanceReminder, "id" | "paid">) => void;
  toggleReminderPaid: (reminderId: string) => void;
  updateSettings: (patch: Partial<FinanceSettings>) => void;
  editCategory: (categoryId: string, input: Partial<Omit<FinanceCategory, "id">>) => void;
  removeCategory: (categoryId: string) => void;
  editBudget: (budgetId: string, input: Partial<Omit<FinanceBudget, "id">>) => void;
  removeBudget: (budgetId: string) => void;
  editGoal: (goalId: string, input: Partial<Omit<FinanceGoal, "id">>) => void;
  removeGoal: (goalId: string) => void;
  editAccount: (accountId: string, input: Partial<Omit<FinanceAccount, "id">>) => void;
  removeAccount: (accountId: string) => void;
  editCard: (cardId: string, input: Partial<Omit<FinanceCard, "id">>) => void;
  removeCard: (cardId: string) => void;
  editReminder: (reminderId: string, input: Partial<Omit<FinanceReminder, "id">>) => void;
  removeReminder: (reminderId: string) => void;
  addDebt: (input: Omit<FinanceDebt, "id">) => void;
  editDebt: (debtId: string, input: Partial<Omit<FinanceDebt, "id">>) => void;
  removeDebt: (debtId: string) => void;
  getCategoryById: (categoryId: string) => FinanceCategory | undefined;
  getBudgetSpent: (budget: FinanceBudget) => number;
  getCurrencySymbol: () => string;
  formatCurrency: (value: number) => string;
}

const STORAGE_KEY = "meu-financeiro:v1";

const COLORS = {
  income: "#16A34A",
  expense: "#EF4444",
  primary: "#2F6BFF",
  secondary: "#8B5CF6",
  amber: "#F59E0B",
  blueSoft: "#38BDF8",
  pink: "#EC4899",
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toIsoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

const today = new Date();
const currentMonth = monthKey(today);
const currentYear = today.getFullYear();
const currentMonthIndex = today.getMonth();

export const defaultState: FinanceState = {
  transactions: [],
  categories: [
    { id: "cat-salario", name: "Salário", type: "income", color: COLORS.income, icon: "arrow.downward" },
    { id: "cat-freela", name: "Freelance", type: "income", color: COLORS.blueSoft, icon: "payments" },
    { id: "cat-alimentacao", name: "Alimentação", type: "expense", color: COLORS.expense, icon: "restaurant" },
    { id: "cat-transporte", name: "Transporte", type: "expense", color: COLORS.primary, icon: "directions-car" },
    { id: "cat-moradia", name: "Moradia", type: "expense", color: COLORS.secondary, icon: "home" },
    { id: "cat-lazer", name: "Lazer", type: "expense", color: COLORS.pink, icon: "celebration" },
    { id: "cat-saude", name: "Saúde", type: "expense", color: COLORS.amber, icon: "health-and-safety" },
  ],
  accounts: [
    { id: "acc-corrente", name: "Conta principal", kind: "bank", balance: 0 },
    { id: "acc-reserva", name: "Reserva", kind: "savings", balance: 0 },
    { id: "acc-carteira", name: "Carteira", kind: "cash", balance: 0 },
  ],
  cards: [
    { id: "card-credito", name: "Cartão principal", limit: 3000, currentBalance: 0, closingDay: 25, dueDay: 5 },
  ],
  budgets: [
    { id: "budget-alimentacao", categoryId: "cat-alimentacao", amount: 800, month: currentMonth },
    { id: "budget-transporte", categoryId: "cat-transporte", amount: 400, month: currentMonth },
    { id: "budget-lazer", categoryId: "cat-lazer", amount: 500, month: currentMonth },
  ],
  goals: [
    {
      id: "goal-reserva",
      name: "Reserva de emergência",
      targetAmount: 10000,
      currentAmount: 0,
      deadline: `${currentYear + 1}-${String(currentMonthIndex + 1).padStart(2, "0")}-30`,
    },
  ],
  reminders: [
    {
      id: "reminder-internet",
      title: "Internet residencial",
      amount: 120,
      dueDate: `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}-15`,
      paid: false,
    },
  ],
  debts: [],
  settings: {
    currency: "BRL",
    notificationsEnabled: true,
    showCents: true,
  },
};

export function adjustAccountBalance(accounts: FinanceAccount[], accountId: string | undefined, delta: number) {
  if (!accountId) return accounts;
  return accounts.map((account) =>
    account.id === accountId ? { ...account, balance: Number((account.balance + delta).toFixed(2)) } : account,
  );
}

export function adjustCardBalance(cards: FinanceCard[], cardId: string | undefined, delta: number) {
  if (!cardId) return cards;
  return cards.map((card) =>
    card.id === cardId ? { ...card, currentBalance: Math.max(0, Number((card.currentBalance + delta).toFixed(2))) } : card,
  );
}

export function applyTransactionEffect(
  baseState: FinanceState,
  transaction: FinanceTransaction,
  direction: 1 | -1,
): FinanceState {
  let nextAccounts = [...baseState.accounts];
  let nextCards = [...baseState.cards];
  const value = Number((transaction.amount * direction).toFixed(2));

  if (transaction.type === "income") {
    nextAccounts = adjustAccountBalance(nextAccounts, transaction.accountId, value);
  }

  if (transaction.type === "expense") {
    if (transaction.cardId) {
      nextCards = adjustCardBalance(nextCards, transaction.cardId, value);
    } else {
      nextAccounts = adjustAccountBalance(nextAccounts, transaction.accountId, -value);
    }
  }

  if (transaction.type === "transfer") {
    nextAccounts = adjustAccountBalance(nextAccounts, transaction.accountId, -value);
    nextAccounts = adjustAccountBalance(nextAccounts, transaction.destinationAccountId, value);
  }

  return {
    ...baseState,
    accounts: nextAccounts,
    cards: nextCards,
  };
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

function getCurrencyLocale(currency: FinanceSettings["currency"]) {
  switch (currency) {
    case "USD":
      return { locale: "en-US", currency };
    case "EUR":
      return { locale: "pt-PT", currency };
    case "BRL":
    default:
      return { locale: "pt-BR", currency: "BRL" as const };
  }
}

function sortTransactions(transactions: FinanceTransaction[]) {
  return [...transactions].sort((a, b) => b.date.localeCompare(a.date));
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(defaultState);
  const [loading, setLoading] = useState(true);
  const hydratedRef = useRef(false);

  useEffect(() => {
    async function loadState() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<FinanceState>;
          setState({
            ...defaultState,
            ...parsed,
            settings: {
              ...defaultState.settings,
              ...(parsed.settings ?? {}),
            },
          });
        }
      } catch (error) {
        console.warn("Erro ao carregar dados financeiros", error);
      } finally {
        hydratedRef.current = true;
        setLoading(false);
      }
    }

    loadState();
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) => {
      console.warn("Erro ao salvar dados financeiros", error);
    });
  }, [state]);

  const getCategoryById = (categoryId: string) => state.categories.find((category) => category.id === categoryId);

  const addTransaction = (input: NewTransactionInput) => {
    const amount = Number(input.amount);
    if (!amount || amount <= 0) return;

    const nextTransaction: FinanceTransaction = {
      id: createId("tx"),
      type: input.type,
      title: input.title.trim() || "Lançamento",
      amount,
      categoryId: input.categoryId,
      accountId: input.accountId,
      destinationAccountId: input.destinationAccountId,
      cardId: input.cardId,
      date: input.date ?? toIsoDate(),
      note: input.note?.trim(),
    };

    setState((current) => {
      const withBalances = applyTransactionEffect(current, nextTransaction, 1);
      return {
        ...withBalances,
        transactions: sortTransactions([nextTransaction, ...current.transactions]),
      };
    });
  };

  const removeTransaction = (transactionId: string) => {
    setState((current) => {
      const transaction = current.transactions.find((item) => item.id === transactionId);
      if (!transaction) return current;

      const reverted = applyTransactionEffect(current, transaction, -1);
      return {
        ...reverted,
        transactions: current.transactions.filter((item) => item.id !== transactionId),
      };
    });
  };

  const addCategory = (input: Omit<FinanceCategory, "id">) => {
    if (!input.name.trim()) return;
    setState((current) => ({
      ...current,
      categories: [
        {
          id: createId("cat"),
          ...input,
          name: input.name.trim(),
        },
        ...current.categories,
      ],
    }));
  };

  const addBudget = (input: Omit<FinanceBudget, "id" | "month"> & { month?: string }) => {
    if (!input.categoryId || input.amount <= 0) return;
    setState((current) => ({
      ...current,
      budgets: [
        {
          id: createId("budget"),
          categoryId: input.categoryId,
          amount: Number(input.amount),
          month: input.month ?? monthKey(),
        },
        ...current.budgets.filter((budget) => !(budget.categoryId === input.categoryId && budget.month === (input.month ?? monthKey()))),
      ],
    }));
  };

  const addGoal = (input: Omit<FinanceGoal, "id">) => {
    if (!input.name.trim() || input.targetAmount <= 0) return;
    setState((current) => ({
      ...current,
      goals: [
        {
          id: createId("goal"),
          ...input,
          name: input.name.trim(),
          currentAmount: Number(input.currentAmount),
          targetAmount: Number(input.targetAmount),
        },
        ...current.goals,
      ],
    }));
  };

  const addAccount = (input: Omit<FinanceAccount, "id">) => {
    if (!input.name.trim()) return;
    setState((current) => ({
      ...current,
      accounts: [
        {
          id: createId("acc"),
          ...input,
          name: input.name.trim(),
          balance: Number(input.balance),
        },
        ...current.accounts,
      ],
    }));
  };

  const addCard = (input: Omit<FinanceCard, "id" | "currentBalance">) => {
    if (!input.name.trim() || input.limit <= 0) return;
    setState((current) => ({
      ...current,
      cards: [
        {
          id: createId("card"),
          name: input.name.trim(),
          limit: Number(input.limit),
          currentBalance: 0,
          closingDay: Number(input.closingDay),
          dueDay: Number(input.dueDay),
        },
        ...current.cards,
      ],
    }));
  };

  const addReminder = (input: Omit<FinanceReminder, "id" | "paid">) => {
    if (!input.title.trim() || input.amount <= 0) return;
    setState((current) => ({
      ...current,
      reminders: [
        {
          id: createId("reminder"),
          title: input.title.trim(),
          amount: Number(input.amount),
          dueDate: input.dueDate,
          paid: false,
        },
        ...current.reminders,
      ],
    }));
  };

  const toggleReminderPaid = (reminderId: string) => {
    setState((current) => ({
      ...current,
      reminders: current.reminders.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, paid: !reminder.paid } : reminder,
      ),
    }));
  };

  const updateSettings = (patch: Partial<FinanceSettings>) => {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...patch,
      },
    }));
  };

  const editCategory = (categoryId: string, input: Partial<Omit<FinanceCategory, "id">>) => {
    setState((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              name: input.name?.trim() || category.name,
              color: input.color || category.color,
              icon: input.icon || category.icon,
              type: input.type || category.type,
            }
          : category,
      ),
    }));
  };

  const removeCategory = (categoryId: string) => {
    setState((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== categoryId),
      budgets: current.budgets.filter((budget) => budget.categoryId !== categoryId),
    }));
  };

  const editBudget = (budgetId: string, input: Partial<Omit<FinanceBudget, "id">>) => {
    setState((current) => ({
      ...current,
      budgets: current.budgets.map((budget) =>
        budget.id === budgetId
          ? {
              ...budget,
              categoryId: input.categoryId || budget.categoryId,
              amount: input.amount && input.amount > 0 ? Number(input.amount) : budget.amount,
              month: input.month || budget.month,
            }
          : budget,
      ),
    }));
  };

  const removeBudget = (budgetId: string) => {
    setState((current) => ({
      ...current,
      budgets: current.budgets.filter((budget) => budget.id !== budgetId),
    }));
  };

  const editGoal = (goalId: string, input: Partial<Omit<FinanceGoal, "id">>) => {
    setState((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              name: input.name?.trim() || goal.name,
              targetAmount: input.targetAmount && input.targetAmount > 0 ? Number(input.targetAmount) : goal.targetAmount,
              currentAmount: input.currentAmount !== undefined ? Number(input.currentAmount) : goal.currentAmount,
              deadline: input.deadline || goal.deadline,
            }
          : goal,
      ),
    }));
  };

  const removeGoal = (goalId: string) => {
    setState((current) => ({
      ...current,
      goals: current.goals.filter((goal) => goal.id !== goalId),
    }));
  };

  const editAccount = (accountId: string, input: Partial<Omit<FinanceAccount, "id">>) => {
    setState((current) => ({
      ...current,
      accounts: current.accounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              name: input.name?.trim() || account.name,
              kind: input.kind || account.kind,
              balance: input.balance !== undefined ? Number(input.balance) : account.balance,
            }
          : account,
      ),
    }));
  };

  const removeAccount = (accountId: string) => {
    setState((current) => ({
      ...current,
      accounts: current.accounts.filter((account) => account.id !== accountId),
      transactions: current.transactions.filter(
        (transaction) => transaction.accountId !== accountId && transaction.destinationAccountId !== accountId,
      ),
    }));
  };

  const editCard = (cardId: string, input: Partial<Omit<FinanceCard, "id">>) => {
    setState((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              name: input.name?.trim() || card.name,
              limit: input.limit && input.limit > 0 ? Number(input.limit) : card.limit,
              closingDay: input.closingDay !== undefined ? Number(input.closingDay) : card.closingDay,
              dueDay: input.dueDay !== undefined ? Number(input.dueDay) : card.dueDay,
            }
          : card,
      ),
    }));
  };

  const removeCard = (cardId: string) => {
    setState((current) => ({
      ...current,
      cards: current.cards.filter((card) => card.id !== cardId),
      transactions: current.transactions.filter((transaction) => transaction.cardId !== cardId),
    }));
  };

  const editReminder = (reminderId: string, input: Partial<Omit<FinanceReminder, "id">>) => {
    setState((current) => ({
      ...current,
      reminders: current.reminders.map((reminder) =>
        reminder.id === reminderId
          ? {
              ...reminder,
              title: input.title?.trim() || reminder.title,
              amount: input.amount && input.amount > 0 ? Number(input.amount) : reminder.amount,
              dueDate: input.dueDate || reminder.dueDate,
              paid: input.paid !== undefined ? input.paid : reminder.paid,
            }
          : reminder,
      ),
    }));
  };

  const removeReminder = (reminderId: string) => {
    setState((current) => ({
      ...current,
      reminders: current.reminders.filter((reminder) => reminder.id !== reminderId),
    }));
  };

  const addDebt = (input: Omit<FinanceDebt, "id">) => {
    setState((current) => ({
      ...current,
      debts: [
        ...current.debts,
        {
          id: createId("debt"),
          title: input.title.trim(),
          amount: Number(input.amount),
          dueDate: input.dueDate,
          status: input.status,
          description: input.description?.trim(),
        },
      ],
    }));
  };

  const editDebt = (debtId: string, input: Partial<Omit<FinanceDebt, "id">>) => {
    setState((current) => ({
      ...current,
      debts: current.debts.map((debt) =>
        debt.id === debtId
          ? {
              ...debt,
              title: input.title?.trim() || debt.title,
              amount: input.amount !== undefined ? Number(input.amount) : debt.amount,
              dueDate: input.dueDate || debt.dueDate,
              status: input.status || debt.status,
              description: input.description?.trim() || debt.description,
            }
          : debt,
      ),
    }));
  };

  const removeDebt = (debtId: string) => {
    setState((current) => ({
      ...current,
      debts: current.debts.filter((debt) => debt.id !== debtId),
    }));
  };

  const currentMonthTransactions = useMemo(
    () => state.transactions.filter((transaction) => transaction.date.startsWith(monthKey())),
    [state.transactions],
  );

  const monthlyIncome = useMemo(
    () =>
      currentMonthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [currentMonthTransactions],
  );

  const monthlyExpense = useMemo(
    () =>
      currentMonthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [currentMonthTransactions],
  );

  const monthlyNet = monthlyIncome - monthlyExpense;

  const totalBalance = useMemo(
    () => state.accounts.reduce((sum, account) => sum + account.balance, 0),
    [state.accounts],
  );

  const totalCardUsage = useMemo(
    () => state.cards.reduce((sum, card) => sum + card.currentBalance, 0),
    [state.cards],
  );

  const upcomingReminders = useMemo(
    () =>
      [...state.reminders]
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .filter((reminder) => !reminder.paid)
        .slice(0, 4),
    [state.reminders],
  );

  const getBudgetSpent = (budget: FinanceBudget) => {
    return state.transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.categoryId === budget.categoryId &&
          transaction.date.startsWith(budget.month),
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const formatCurrency = (value: number) => {
    const { locale, currency } = getCurrencyLocale(state.settings.currency);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: state.settings.showCents ? 2 : 0,
      maximumFractionDigits: state.settings.showCents ? 2 : 0,
    }).format(value);
  };

  const getCurrencySymbol = () => {
    const map = {
      BRL: "R$",
      USD: "$",
      EUR: "€",
    } as const;
    return map[state.settings.currency];
  };

  const value = useMemo<FinanceContextValue>(
    () => ({
      state,
      loading,
      monthlyIncome,
      monthlyExpense,
      monthlyNet,
      totalBalance,
      totalCardUsage,
      upcomingReminders,
      addTransaction,
      removeTransaction,
      addCategory,
      editCategory,
      removeCategory,
      addBudget,
      editBudget,
      removeBudget,
      addGoal,
      editGoal,
      removeGoal,
      addAccount,
      editAccount,
      removeAccount,
      addCard,
      editCard,
      removeCard,
      addReminder,
      toggleReminderPaid,
      editReminder,
      removeReminder,
      addDebt,
      editDebt,
      removeDebt,
      updateSettings,
      getCategoryById,
      getBudgetSpent,
      getCurrencySymbol,
      formatCurrency,
    }),
    [loading, monthlyExpense, monthlyIncome, monthlyNet, state, totalBalance, totalCardUsage, upcomingReminders],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error("useFinance deve ser usado dentro de FinanceProvider");
  }

  return context;
}
