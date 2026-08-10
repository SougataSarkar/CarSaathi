import { formatINR, formatCompactINR } from "./currency";

test("formatINR works", () => {
  expect(formatINR(500000)).toBe("₹5,00,000.00");
});

test("formatCompactINR works", () => {
  expect(formatCompactINR(12500000)).toBe("₹1.25 Cr");
});

test("handles zero", () => {
  expect(formatINR(0)).toBe("₹0.00");
});

test("handles negatives", () => {
  expect(formatINR(-5000)).toBe("-₹5,000.00");
});
