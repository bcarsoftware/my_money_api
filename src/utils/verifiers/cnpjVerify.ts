export function computeCheckerDigits(cnpjBase: string): string {
  const weigth1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weigth2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const charactereValue = (c: string): number => c.charCodeAt(0) - 48;

  const computeDigit = (base: string, weigths: number[]): number => {
    const soma = weigths.reduce(
      (acc, weight, i) => acc + charactereValue(base.charAt(i)) * weight,
      0
    );
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const base = cnpjBase.toUpperCase();
  const dc1 = computeDigit(base, weigth1);
  const dc2 = computeDigit(base + dc1, weigth2);

  return `${dc1}${dc2}`;
}

function isRepeatedCharacterSequence(base: string): boolean {
  return new Set(base).size === 1;
}

export function cnpjVerify(cnpj: string) {
  const valor = cnpj.toUpperCase();

  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(valor)) return false;
  if (isRepeatedCharacterSequence(valor.slice(0, 12))) return false;

  const base = valor.slice(0, 12);
  const dvInformado = valor.slice(12);
  const dvCalculado = computeCheckerDigits(base);

  return dvInformado === dvCalculado;
}
