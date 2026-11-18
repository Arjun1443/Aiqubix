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
    <form action={submit} className="academy-form">
      {children}
      <button type="submit" disabled={pending} className="academy-button">
        {pending ? "Saving…" : title}
      </button>
      {state.message && <p role="status" className="academy-form-message">{state.message}</p>}
      {state.invite && <output className="academy-code">{state.invite}</output>}
    </form>
  );
}

export function Field({ label, name, type = "text", defaultValue, autoComplete, minLength, maxLength, min, max, required = true }: {
  label: string; name: string; type?: string; defaultValue?: string;
  autoComplete?: string; minLength?: number; maxLength?: number; min?: number; max?: number; required?: boolean;
}) {
  return (
    <label className="academy-field">
      {label}
      <input name={name} type={type} required={required}
        defaultValue={defaultValue} autoComplete={autoComplete} minLength={minLength} maxLength={maxLength} min={min} max={max}
        className="academy-input" />
    </label>
  );
}
