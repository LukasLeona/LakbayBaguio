const colors = ["#ef8f3f", "#4f8175", "#d16b5f", "#6d78a8", "#a57245", "#557c43", "#9a6790", "#427f95"];

export function TravelerAvatar({ alias, seed = 0, size = "medium" }: { alias: string; seed?: number; size?: "small" | "medium" | "large" }) {
  const initials = alias.replace(/[0-9]/g, "").match(/[A-Z]/g)?.slice(0, 2).join("") || alias.slice(0, 2).toUpperCase();
  return <span className={`traveler-avatar ${size}`} style={{ background: colors[Math.abs(seed) % colors.length] }}>{initials}</span>;
}
