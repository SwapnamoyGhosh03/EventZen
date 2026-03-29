export function generateQRValue(ticketId: string, hash?: string): string {
  if (hash) return `${ticketId}:${hash}`;
  return ticketId;
}

export function parseQRValue(value: string): {
  ticketId: string;
  hash?: string;
} {
  const parts = value.split(":");
  return {
    ticketId: parts[0],
    hash: parts[1],
  };
}
