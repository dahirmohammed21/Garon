import { Crown } from "lucide-react";
export function GaronMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="19"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity=".5"
      />
      <path
        d="M34 12a16 16 0 1 0 5 17H25v-7h17M24 4v6M4 24h6M24 38v6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}
export function RoleLogo({ role }: { role: string }) {
  return role === "owner" ? (
    <Crown size={26} />
  ) : role === "garon" ? (
    <GaronMark size={32} />
  ) : (
    <img
      className="provider-logo"
      src={`/brands/${role === "openai" ? "openai" : "claude"}.svg`}
      alt={role === "openai" ? "OpenAI" : "Claude"}
    />
  );
}
