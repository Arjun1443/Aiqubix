import { activate } from "../actions";
import { AccountForm, Field } from "../account-form";

export default function ActivatePage() {
  return (
    <section className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <h1 className="mb-5 text-2xl font-semibold">Activate your staff account</h1>
      <AccountForm action={activate} title="Activate account">
        <Field label="Email" name="email" type="email" autoComplete="username" maxLength={254} />
        <Field label="Activation code" name="code" autoComplete="one-time-code" maxLength={64} />
        <Field label="New password (at least 12 characters)" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} />
      </AccountForm>
    </section>
  );
}
