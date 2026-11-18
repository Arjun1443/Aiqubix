import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAccount } from "@/lib/academy-accounts";
import { intakeForms, intakeResponses } from "@/lib/trainer-intake";
import { AccountForm, Field } from "../../account-form";
import { submitIntake } from "../actions";

export default async function StudentIntake({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await intakeForms().findOne({ _id: id }, { projection: { trainer: 0 } });
  if (!form) notFound();
  const student = await currentAccount();
  const previous = student?.role === "student" ? await intakeResponses().findOne({ form: id, student: student._id }) : null;

  return (
    <section className="academy-panel academy-entry">
      <header className="academy-entry-header">
        <h1 className="academy-title">{form.title}</h1>
        <p className="academy-description">{form.course}</p>
      </header>
      <div className="academy-panel-body">
        {student?.role === "student" ? <>
          <p className="academy-email"><span>Sharing details with your trainer</span>{student._id}</p>
          <AccountForm action={submitIntake} title={previous ? "Update details" : "Submit details"}>
            <input type="hidden" name="form" value={form._id} />
            <Field label="Full name" name="name" defaultValue={previous?.name ?? student.name} minLength={2} maxLength={100} autoComplete="name" />
            <Field label="Phone number" name="phone" type="tel" defaultValue={previous?.phone} maxLength={25} autoComplete="tel" />
            <Field label="Education or current institution" name="education" defaultValue={previous?.education} maxLength={200} />
            {form.questions.map((question, index) => <label key={index} className="academy-field">{question}
              <textarea name={`answer-${index}`} defaultValue={previous?.answers[index]} required maxLength={1500} rows={3} className="academy-input" />
            </label>)}
          </AccountForm>
        </> : <>
          <p className="academy-description">{student ? "This form accepts submissions from student accounts." : "Sign in with a student account to submit your details."}</p>
          <div className="academy-entry-links">
            <Link href={`/login?intake=${id}`}>Sign in</Link><Link href={`/register?intake=${id}`}>Create a student account</Link>
          </div>
        </>}
      </div>
    </section>
  );
}
