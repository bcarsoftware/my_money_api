export function cpfVerify(cpf: string): boolean {
  if (!cpf || typeof cpf !== "string") return false;

  const regex = /^[0-9]{11}$/;
  if (!regex.test(cpf)) return false;

  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cpf[i]) * (10 - i);
  }

  let rest = sum % 11;
  const firstDigit = rest < 2 ? 0 : 11 - rest;

  if (firstDigit !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cpf[i]) * (11 - i);
  }

  rest = sum % 11;
  const secondDigit = rest < 2 ? 0 : 11 - rest;

  if (secondDigit !== Number(cpf[10])) return false;

  return true;
}
