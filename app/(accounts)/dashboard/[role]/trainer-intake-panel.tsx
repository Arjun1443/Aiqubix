import Link from "next/link";
import { intakeForms, intakeResponses } from "@/lib/trainer-intake";
import type { Course } from "@/lib/course-catalogue";
import { AccountForm, Field } from "../../account-form";
import { createIntakeBatch, publishIntake } from "../../intake/actions";

function formLink(id: string, batch?: string) {
  const query = new URLSearchParams({ section: "forms", intake: id });
  if (batch) query.set("batch", batch);
  return `/dashboard/trainer?${query}`;
}

export async function TrainerIntakePanel({ owner, courses, selected, batch }: {
  owner: string; courses: Course[]; selected?: string; batch?: string;
}) {
  const forms = await intakeForms().find({ trainer: owner }).sort({ createdAt: -1, _id: 1 }).toArray();
  const current = forms.find((form) => form._id === selected) ?? forms[0];
  const responses = current ? await intakeResponses()
    .find({ form: current._id }).sort({ submittedAt: -1, _id: 1 }).toArray() : [];

  return <>
    <section className="academy-panel academy-panel-body trainer-section">
      <h2>Publish a student details form</h2>
      <p className="academy-empty">Students share their name, academy email, phone number and education. Add any extra questions your class needs.</p>
      <AccountForm action={publishIntake} title="Publish form">
        <Field label="Form title" name="title" maxLength={120} />
        <label className="academy-field">Course
          <select required name="course" className="academy-input">
            <option value="">Select a course</option>
            {courses.map((course) => <option key={course.title}>{course.title}</option>)}
          </select>
        </label>
        <label className="academy-field">Extra questions (optional, one per line)
          <textarea name="questions" maxLength={1810} className="academy-input" rows={4} />
        </label>
      </AccountForm>
    </section>
    <section className="academy-panel academy-panel-body trainer-section">
      <h2>Published forms</h2>
      {forms.length ? <ul className="academy-course-list">{forms.map((form) => (
        <li key={form._id}><div>
          <Link className="trainer-link" href={formLink(form._id, batch)} aria-current={current?._id === form._id ? "page" : undefined}>{form.title}</Link>
          <small>{form.course}</small>
        </div></li>
      ))}</ul> : <p className="academy-empty">Publish your first form to collect student details.</p>}
    </section>
    {current && <section className="academy-panel academy-panel-body trainer-section">
      <h2>{current.title} · Responses</h2>
      <p className="academy-empty">Copy the student form link and share it with your class.</p>
      <Link className="trainer-link" href={`/intake/${current._id}`} target="_blank" rel="noopener noreferrer">Open student form</Link>
      {responses.length ? <AccountForm key={current._id} title="Create batch" action={createIntakeBatch}>
        <input type="hidden" name="form" value={current._id} />
        <Field label="Batch name" name="name" maxLength={100} />
        <fieldset className="trainer-intake-choices">
          <legend>Select students for this batch</legend>
          {responses.map((response) => (
            <div key={response._id} className="academy-progress-item">
              <label className="trainer-intake-check"><input type="checkbox" name="students" value={response._id} /> {response.name} · {response.student}</label>
              <dl className="trainer-intake-details">
                <div><dt>Phone</dt><dd>{response.phone}</dd></div>
                <div><dt>Education</dt><dd>{response.education}</dd></div>
                {current.questions.map((question, index) => <div key={index}><dt>{question}</dt><dd>{response.answers[index]}</dd></div>)}
              </dl>
            </div>
          ))}
        </fieldset>
      </AccountForm> : <p className="academy-empty">No students have submitted this form yet.</p>}
      <Link className="trainer-link" href={`/dashboard/trainer?section=batches`}>View created batches</Link>
    </section>}
  </>;
}
