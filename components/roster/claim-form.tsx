"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimAthleteProfile } from "@/lib/data/roster-actions";

export function ClaimForm({ athleteId }: { athleteId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await claimAthleteProfile({ athleteId, email });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo vincular.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-md border border-black/10 p-4">
      <label className="grid gap-1 text-sm">
        <span className="text-black/60">
          Este deportista todavía no tiene cuenta. Si ya se registró, vinculala por su correo:
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className="rounded-md border border-black/15 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Vinculando…" : "Vincular cuenta"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
