const CURRENCY_FORMATTER = new Intl.NumberFormat("bn-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

export function formatCurrency(amount: number) {
  return CURRENCY_FORMATTER.format(amount);
}
const NUMBER_FORMATTER = new Intl.NumberFormat("bn-BD", {
  //   style: 'decimal',
  //   minimumFractionDigits: 2
});
export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number);
}
