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
