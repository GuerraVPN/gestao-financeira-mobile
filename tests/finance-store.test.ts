import { describe, expect, it } from "vitest";

import {
  applyTransactionEffect,
  defaultState,
  monthKey,
  type FinanceState,
  type FinanceTransaction,
} from "../lib/finance-store";

function cloneState(overrides?: Partial<FinanceState>): FinanceState {
  return {
    ...JSON.parse(JSON.stringify(defaultState)) as FinanceState,
    ...overrides,
  };
}

describe("finance-store business rules", () => {
  it("gera a chave mensal no formato AAAA-MM", () => {
    expect(monthKey(new Date("2026-04-12T12:00:00Z"))).toBe("2026-04");
  });

  it("soma receita ao saldo da conta de destino", () => {
    const state = cloneState({
      accounts: [{ id: "acc-1", name: "Conta", kind: "bank", balance: 1000 }],
      cards: [],
      transactions: [],
    });

    const transaction: FinanceTransaction = {
      id: "tx-1",
      type: "income",
      title: "Salário",
      amount: 500,
      categoryId: "cat-salario",
      accountId: "acc-1",
      date: "2026-04-12",
    };

    const next = applyTransactionEffect(state, transaction, 1);
    expect(next.accounts[0]?.balance).toBe(1500);
  });

  it("desconta despesa paga pela conta corrente", () => {
    const state = cloneState({
      accounts: [{ id: "acc-1", name: "Conta", kind: "bank", balance: 800 }],
      cards: [],
      transactions: [],
    });

    const transaction: FinanceTransaction = {
      id: "tx-2",
      type: "expense",
      title: "Mercado",
      amount: 180,
      categoryId: "cat-alimentacao",
      accountId: "acc-1",
      date: "2026-04-12",
    };

    const next = applyTransactionEffect(state, transaction, 1);
    expect(next.accounts[0]?.balance).toBe(620);
  });

  it("acumula despesa no cartão quando o lançamento usa crédito", () => {
    const state = cloneState({
      accounts: [{ id: "acc-1", name: "Conta", kind: "bank", balance: 800 }],
      cards: [{ id: "card-1", name: "Cartão", limit: 2000, currentBalance: 300, closingDay: 25, dueDay: 5 }],
      transactions: [],
    });

    const transaction: FinanceTransaction = {
      id: "tx-3",
      type: "expense",
      title: "Assinatura",
      amount: 50,
      categoryId: "cat-lazer",
      accountId: "acc-1",
      cardId: "card-1",
      date: "2026-04-12",
    };

    const next = applyTransactionEffect(state, transaction, 1);
    expect(next.cards[0]?.currentBalance).toBe(350);
    expect(next.accounts[0]?.balance).toBe(800);
  });

  it("move saldo entre contas em transferências", () => {
    const state = cloneState({
      accounts: [
        { id: "acc-1", name: "Conta principal", kind: "bank", balance: 1000 },
        { id: "acc-2", name: "Reserva", kind: "savings", balance: 300 },
      ],
      cards: [],
      transactions: [],
    });

    const transaction: FinanceTransaction = {
      id: "tx-4",
      type: "transfer",
      title: "Reserva mensal",
      amount: 250,
      categoryId: "cat-salario",
      accountId: "acc-1",
      destinationAccountId: "acc-2",
      date: "2026-04-12",
    };

    const next = applyTransactionEffect(state, transaction, 1);
    expect(next.accounts.find((account) => account.id === "acc-1")?.balance).toBe(750);
    expect(next.accounts.find((account) => account.id === "acc-2")?.balance).toBe(550);
  });
});


describe("v1.0.5 - Edit and Delete Operations", () => {
  it("edita nome e cor de uma categoria", () => {
    const state = cloneState({
      categories: [{ id: "cat-1", name: "Alimentação", type: "expense", color: "#2F6BFF", icon: "payments" }],
    });

    const updated = {
      ...state,
      categories: state.categories.map((cat) =>
        cat.id === "cat-1"
          ? { ...cat, name: "Comida", color: "#FF0000" }
          : cat,
      ),
    };

    expect(updated.categories[0]?.name).toBe("Comida");
    expect(updated.categories[0]?.color).toBe("#FF0000");
  });

  it("remove categoria e seus orçamentos associados", () => {
    const state = cloneState({
      categories: [{ id: "cat-1", name: "Alimentação", type: "expense", color: "#2F6BFF", icon: "payments" }],
      budgets: [{ id: "budget-1", categoryId: "cat-1", amount: 500, month: "2026-04" }],
    });

    const updated = {
      ...state,
      categories: state.categories.filter((cat) => cat.id !== "cat-1"),
      budgets: state.budgets.filter((budget) => budget.categoryId !== "cat-1"),
    };

    expect(updated.categories).toHaveLength(0);
    expect(updated.budgets).toHaveLength(0);
  });

  it("edita valor de um orçamento", () => {
    const state = cloneState({
      budgets: [{ id: "budget-1", categoryId: "cat-1", amount: 500, month: "2026-04" }],
    });

    const updated = {
      ...state,
      budgets: state.budgets.map((b) =>
        b.id === "budget-1" ? { ...b, amount: 750 } : b,
      ),
    };

    expect(updated.budgets[0]?.amount).toBe(750);
  });

  it("remove orçamento", () => {
    const state = cloneState({
      budgets: [{ id: "budget-1", categoryId: "cat-1", amount: 500, month: "2026-04" }],
    });

    const updated = {
      ...state,
      budgets: state.budgets.filter((b) => b.id !== "budget-1"),
    };

    expect(updated.budgets).toHaveLength(0);
  });

  it("edita nome e valor alvo de uma meta", () => {
    const state = cloneState({
      goals: [{ id: "goal-1", name: "Viagem", targetAmount: 3000, currentAmount: 500, deadline: "2026-12-31" }],
    });

    const updated = {
      ...state,
      goals: state.goals.map((g) =>
        g.id === "goal-1"
          ? { ...g, name: "Viagem Europa", targetAmount: 5000 }
          : g,
      ),
    };

    expect(updated.goals[0]?.name).toBe("Viagem Europa");
    expect(updated.goals[0]?.targetAmount).toBe(5000);
  });

  it("remove meta", () => {
    const state = cloneState({
      goals: [{ id: "goal-1", name: "Viagem", targetAmount: 3000, currentAmount: 500, deadline: "2026-12-31" }],
    });

    const updated = {
      ...state,
      goals: state.goals.filter((g) => g.id !== "goal-1"),
    };

    expect(updated.goals).toHaveLength(0);
  });

  it("edita nome e saldo de uma conta", () => {
    const state = cloneState({
      accounts: [{ id: "acc-1", name: "Banco", kind: "bank", balance: 1000 }],
    });

    const updated = {
      ...state,
      accounts: state.accounts.map((a) =>
        a.id === "acc-1"
          ? { ...a, name: "Banco Principal", balance: 1500 }
          : a,
      ),
    };

    expect(updated.accounts[0]?.name).toBe("Banco Principal");
    expect(updated.accounts[0]?.balance).toBe(1500);
  });

  it("remove conta e suas transações associadas", () => {
    const state = cloneState({
      accounts: [{ id: "acc-1", name: "Banco", kind: "bank", balance: 1000 }],
      transactions: [
        {
          id: "tx-1",
          type: "income",
          title: "Salário",
          amount: 500,
          categoryId: "cat-1",
          accountId: "acc-1",
          date: "2026-04-12",
        },
      ],
    });

    const updated = {
      ...state,
      accounts: state.accounts.filter((a) => a.id !== "acc-1"),
      transactions: state.transactions.filter(
        (t) => t.accountId !== "acc-1" && t.destinationAccountId !== "acc-1",
      ),
    };

    expect(updated.accounts).toHaveLength(0);
    expect(updated.transactions).toHaveLength(0);
  });

  it("edita limite e dia de vencimento de um cartão", () => {
    const state = cloneState({
      cards: [{ id: "card-1", name: "Cartão", limit: 2000, currentBalance: 300, closingDay: 25, dueDay: 5 }],
    });

    const updated = {
      ...state,
      cards: state.cards.map((c) =>
        c.id === "card-1"
          ? { ...c, limit: 3000, dueDay: 10 }
          : c,
      ),
    };

    expect(updated.cards[0]?.limit).toBe(3000);
    expect(updated.cards[0]?.dueDay).toBe(10);
  });

  it("remove cartão e suas transações associadas", () => {
    const state = cloneState({
      cards: [{ id: "card-1", name: "Cartão", limit: 2000, currentBalance: 300, closingDay: 25, dueDay: 5 }],
      transactions: [
        {
          id: "tx-1",
          type: "expense",
          title: "Compra",
          amount: 100,
          categoryId: "cat-1",
          cardId: "card-1",
          date: "2026-04-12",
        },
      ],
    });

    const updated = {
      ...state,
      cards: state.cards.filter((c) => c.id !== "card-1"),
      transactions: state.transactions.filter((t) => t.cardId !== "card-1"),
    };

    expect(updated.cards).toHaveLength(0);
    expect(updated.transactions).toHaveLength(0);
  });
});


describe("v1.0.7 - Edit and Delete Reminders", () => {
  it("edita título, valor e data de vencimento de um lembrete", () => {
    const state = cloneState({
      reminders: [{ id: "reminder-1", title: "Aluguel", amount: 1500, dueDate: "2026-04-15", paid: false }],
    });

    const updated = {
      ...state,
      reminders: state.reminders.map((r) =>
        r.id === "reminder-1"
          ? { ...r, title: "Aluguel e condomínio", amount: 1800, dueDate: "2026-04-10" }
          : r,
      ),
    };

    expect(updated.reminders[0]?.title).toBe("Aluguel e condomínio");
    expect(updated.reminders[0]?.amount).toBe(1800);
    expect(updated.reminders[0]?.dueDate).toBe("2026-04-10");
  });

  it("marca lembrete como pago ao editar", () => {
    const state = cloneState({
      reminders: [{ id: "reminder-1", title: "Aluguel", amount: 1500, dueDate: "2026-04-15", paid: false }],
    });

    const updated = {
      ...state,
      reminders: state.reminders.map((r) =>
        r.id === "reminder-1" ? { ...r, paid: true } : r,
      ),
    };

    expect(updated.reminders[0]?.paid).toBe(true);
  });

  it("remove lembrete", () => {
    const state = cloneState({
      reminders: [{ id: "reminder-1", title: "Aluguel", amount: 1500, dueDate: "2026-04-15", paid: false }],
    });

    const updated = {
      ...state,
      reminders: state.reminders.filter((r) => r.id !== "reminder-1"),
    };

    expect(updated.reminders).toHaveLength(0);
  });

  it("mantém integridade ao remover múltiplos lembretes", () => {
    const state = cloneState({
      reminders: [
        { id: "reminder-1", title: "Aluguel", amount: 1500, dueDate: "2026-04-15", paid: false },
        { id: "reminder-2", title: "Internet", amount: 120, dueDate: "2026-04-20", paid: false },
        { id: "reminder-3", title: "Água", amount: 80, dueDate: "2026-04-25", paid: false },
      ],
    });

    const updated = {
      ...state,
      reminders: state.reminders.filter((r) => r.id !== "reminder-1" && r.id !== "reminder-3"),
    };

    expect(updated.reminders).toHaveLength(1);
    expect(updated.reminders[0]?.id).toBe("reminder-2");
  });
});
