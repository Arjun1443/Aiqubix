import Link from "next/link";
import { register } from "../actions";
import { AccountForm, Field } from "../account-form";

export default function RegisterPage() {
  return (
    <section className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <h1 className="mb-5 text-2xl font-semibold">Create a student account</h1>
      <AccountForm action={register} title="Create account">
        <Field label="Full name" name="name" autoComplete="name" minLength={2} maxLength={100} />
        <Field label="Email" name="email" type="email" autoComplete="email" maxLength={254} />
        <Field label="Password (at least 12 characters)" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} />
      </AccountForm>
      <Link href="/login" className="mt-6 inline-block text-sm text-cyan-200">Back to sign in</Link>
    </section>
  );
}
