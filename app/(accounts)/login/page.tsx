import Link from "next/link";
import { intakeReturnPath } from "@/lib/trainer-intake";
import { login } from "../actions";
import { AccountForm, Field } from "../account-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ intake?: string }> }) {
  const { intake } = await searchParams;
  const returnToForm = intakeReturnPath(intake) ? intake : undefined;
  return (
    <section className="academy-panel academy-entry">
      <header className="academy-entry-header">
        <h1 className="academy-title">Sign in</h1>
        <p className="academy-description">Use your academy account to open your dashboard.</p>
      </header>
      <div className="academy-panel-body">
        <AccountForm action={login} title="Sign in">
          {returnToForm && <input type="hidden" name="intake" value={returnToForm} />}
          <Field label="Email" name="email" type="email" autoComplete="username" maxLength={254} />
          <Field label="Password" name="password" type="password" autoComplete="current-password" maxLength={128} />
        </AccountForm>
        <div className="academy-entry-links">
          <Link href={returnToForm ? `/register?intake=${returnToForm}` : "/register"}>Create a student account</Link>
          <Link href="/activate">Activate staff account</Link>
        </div>
      </div>
    </section>
  );
}
