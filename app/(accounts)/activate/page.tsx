import Link from "next/link";
import { activate } from "../actions";
import { AccountForm, Field } from "../account-form";

export default function ActivatePage() {
  return (
    <section className="academy-panel academy-entry">
      <header className="academy-entry-header">
        <h1 className="academy-title">Activate your staff account</h1>
        <p className="academy-description">Use the activation code provided by your academy admin.</p>
      </header>
      <div className="academy-panel-body">
        <AccountForm action={activate} title="Activate account">
          <Field label="Email" name="email" type="email" autoComplete="username" maxLength={254} />
          <Field label="Activation code" name="code" autoComplete="one-time-code" maxLength={64} />
          <Field label="New password (at least 12 characters)" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} />
        </AccountForm>
        <div className="academy-entry-links"><Link href="/login">Back to sign in</Link></div>
      </div>
    </section>
  );
}
