"use client";

interface AvatarUploaderProps {
  avatar?: string;
  nombre: string;
  perfilId: string;
}

function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || name.trim() === "") return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function AvatarUploader({ avatar, nombre, perfilId }: AvatarUploaderProps) {
  if (avatar) {
    return (
      <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
      style={{ backgroundColor: hashColor(perfilId) }}
    >
      {initials(nombre || "?")}
    </div>
  );
}
