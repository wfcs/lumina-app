import { institutions } from "@/lib/mock-data";

export function InstLogo({ id, size = 28 }: { id: string; size?: number }) {
  const inst = institutions.find((i) => i.id === id);
  return (
    <div
      className="rounded-lg grid place-items-center text-white shrink-0"
      style={{ width: size, height: size, background: inst?.color ?? "#6B7280", fontSize: size * 0.5 }}
      title={inst?.name ?? "Manual"}
    >
      {inst ? inst.emoji : "💵"}
    </div>
  );
}
