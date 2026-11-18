import Link from "next/link";
import { login } from "../actions";
import { AccountForm, Field } from "../account-form";

export default function LoginPage() {
  return (
    <section className="academy-panel academy-entry">
      <header className="academy-entry-header">
        <h1 className="academy-title">Sign in</h1>
        <p className="academy-description">Use your academy account to open your dashboard.</p>
      </header>
      <div className="academy-panel-body">
        <AccountForm action={login} title="Sign in">
          <Field label="Email" name="email" type="email" autoComplete="username" maxLength={254} />
          <Field label="Password" name="password" type="password" autoComplete="current-password" maxLength={128} />
        </AccountForm>
        <div className="academy-entry-links">
          <Link href="/register">Create a student account</Link>
          <Link href="/activate">Activate staff account</Link>
        </div>
      </div>
    </section>
  );
}
