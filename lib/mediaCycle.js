export function advanceCycle(index, length) {
  if (length <= 1) return 0;
  return (index + 1) % length;
}
