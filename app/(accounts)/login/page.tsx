import Link from "next/link";
import { login } from "../actions";
import { AccountForm, Field } from "../account-form";

export default function LoginPage() {
  return (
    <section className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <h1 className="mb-5 text-2xl font-semibold">Sign in</h1>
      <AccountForm action={login} title="Sign in">
        <Field label="Email" name="email" type="email" autoComplete="username" maxLength={254} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" maxLength={128} />
      </AccountForm>
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-cyan-200">
        <Link href="/register">Create a student account</Link>
        <Link href="/activate">Activate staff account</Link>
      </div>
    </section>
  );
}
