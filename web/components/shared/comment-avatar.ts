/**
 * comment-avatar.ts
 * Renders a circle avatar with initials and a deterministic color based on the name.
 * Shared by comment-item and comment-compose.
 */
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

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

@customElement("comment-avatar")
export class CommentAvatar extends LitElement {
  static override styles = css`
    :host { display: inline-flex; flex-shrink: 0; }
    .av {
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; color: #fff;
      user-select: none;
    }
    .av.md { width: 40px; height: 40px; font-size: 15px; }
    .av.sm { width: 30px; height: 30px; font-size: 11px; }
  `;

  @property() name = "?";
  @property() size: "md" | "sm" = "md";

  override render() {
    return html`
      <div class="av ${this.size}" style="background:${avatarColor(this.name)}">
        ${initials(this.name)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { "comment-avatar": CommentAvatar; }
}
