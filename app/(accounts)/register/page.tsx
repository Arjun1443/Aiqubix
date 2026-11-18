import Link from "next/link";
import { register } from "../actions";
import { AccountForm, Field } from "../account-form";

export default function RegisterPage() {
  return (
    <section className="academy-panel academy-entry">
      <header className="academy-entry-header">
        <h1 className="academy-title">Create a student account</h1>
        <p className="academy-description">Create your profile to enroll in academy courses.</p>
      </header>
      <div className="academy-panel-body">
        <AccountForm action={register} title="Create account">
          <Field label="Full name" name="name" autoComplete="name" minLength={2} maxLength={100} />
          <Field label="Email" name="email" type="email" autoComplete="email" maxLength={254} />
          <Field label="Password (at least 12 characters)" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} />
        </AccountForm>
        <div className="academy-entry-links"><Link href="/login">Back to sign in</Link></div>
      </div>
    </section>
  );
}
