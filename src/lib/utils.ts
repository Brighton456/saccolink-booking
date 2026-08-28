export const money = (n: number) => `KES ${n.toLocaleString()}`;

export const timeOf = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true });
};

export const today = () => new Date().toISOString().slice(0, 10);
