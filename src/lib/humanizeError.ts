// Convert low-level network/auth errors into user-friendly text.
// Keep this small and dependency-free.

export function humanizeError(err: unknown): string | null {
  const message =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err
        ? String((err as any).message)
        : "";

  const m = message.toLowerCase();

  // Browser fetch/network failures (common when backend domain is blocked by VPN/Private DNS/firewall)
  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("err_tunnel_connection_failed")
  ) {
    return "Can’t reach the backend right now. Please disable VPN/Private DNS/ad-blockers and try again, or switch networks.";
  }

  // Supabase-style messages we want to make friendlier
  if (m.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (m.includes("user already registered") || m.includes("already registered")) {
    return "This email is already registered. Try signing in instead.";
  }

  return null;
}
