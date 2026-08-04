export function getFlagUrl(countryCode: string): string | null {
  if (!countryCode || countryCode.toUpperCase() === "INTL") return null;
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}