import { h } from 'preact';
import { useState } from 'preact/hooks';
import { authStore } from "../../services/auth-store";
import i18next from "../../utils/i18n";

interface CommentAvatarProps {
  name?: string;
  size?: "md" | "sm";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map(w => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function avatarColor(name: string): string {
  const palette = [
    "#e74c3c", "#e67e22", "#f39c12", "#2ecc71",
    "#1abc9c", "#3498db", "#9b59b6", "#e91e63",
    "#00bcd4", "#ff5722",
  ];
  let hash = 0;
  for (const ch of name) hash = ((hash * 31) + ch.charCodeAt(0)) & 0xffffffff;
  return palette[Math.abs(hash) % palette.length]!;
}

export function CommentAvatar({ name = "?", size = "md" }: CommentAvatarProps) {
  return (
    <div class={`av ${size}`} style={{ background: avatarColor(name) }}>
      {initials(name)}
    </div>
  );
}