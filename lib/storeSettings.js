export function validateMinOrder(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('Pedido mínimo precisa ser um número inteiro maior ou igual a 1.');
  }
  return n;
}
