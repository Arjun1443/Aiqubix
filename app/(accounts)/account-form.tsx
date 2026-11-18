"use client";

import { useActionState, type ReactNode } from "react";
import type { FormResult } from "./actions";

export function AccountForm({ action, title, children }: {
  action: (state: FormResult, form: FormData) => Promise<FormResult>;
  title: string;
  children: ReactNode;
}) {
  const [state, submit, pending] = useActionState(action, { message: "" });
  return (
    <form action={submit} className="space-y-4">
      {children}
      <button type="submit" disabled={pending} className="rounded-lg bg-cyan-200 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">
        {pending ? "Saving…" : title}
      </button>
      {state.message && <p role="status" className="text-sm text-cyan-100">{state.message}</p>}
      {state.invite && <output className="block break-all rounded-lg bg-slate-950 p-3 font-mono text-sm text-cyan-100">{state.invite}</output>}
    </form>
  );
}

export function Field({ label, name, type = "text", defaultValue, autoComplete, minLength, maxLength, required = true }: {
  label: string; name: string; type?: string; defaultValue?: string;
  autoComplete?: string; minLength?: number; maxLength?: number; required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-200">
      {label}
      <input name={name} type={type} required={required}
        defaultValue={defaultValue} autoComplete={autoComplete} minLength={minLength} maxLength={maxLength}
        className="mt-1.5 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" />
    </label>
  );
}
