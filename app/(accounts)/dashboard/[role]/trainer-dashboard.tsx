import Link from "next/link";
import { courseLessonPath } from "@/lib/course-paths";
import { BookOpen, ChevronRight, LogOut } from "lucide-react";
import { accounts, profileFields, type Account } from "@/lib/academy-accounts";
import { getCourses } from "@/lib/academy-courses";
import { activities, sections, trainerBatches, trainerRecords, type ActivityField, type ActivityKind, type TrainerRecord } from "@/lib/trainer-workspace";
import { saveProfile, signOut } from "../../actions";
import { AccountForm, Field } from "../../account-form";
import { addLearner, createBatch, saveTrainerRecord } from "./trainer-actions";
import { TrainerIntakePanel } from "./trainer-intake-panel";
import { WorkAppraisals, WorkAttendance, WorkLeave } from "../workforce/workforce-sections";
import { WorkspaceSummary } from "./workspace";

type Query = { section?: string; batch?: string; edit?: string; intake?: string };
const path = "/dashboard/trainer";
function link(section: string, batch?: string, edit?: string) {
  const params = new URLSearchParams({ section });
  if (batch) params.set("batch", batch);
  if (edit) params.set("edit", edit);
  return `${path}?${params}`;
}
const reports = [
  ["delivery", "Class plans"], ["assessment", "Assessments and results"], ["attendance", "Attendance entries"],
  ["fellowship", "SDP updates"], ["capstone", "Capstone teams"], ["forms", "Form templates"], ["queries", "Learner queries"],
] as const;
const descriptions: Record<ActivityKind, string> = {
  delivery: "Plan class dates, lesson topics, resources and meeting links.",
  assessment: "Plan assessments and record individual scores and feedback.",
  attendance: "Record attendance by class date, session title and learner. Saving the same entry updates it.",
  fellowship: "Document individual skill-development reviews and follow-up actions.",
  capstone: "Record project teams, milestones and the next deliverable.",
  forms: "Draft reusable question templates for feedback and check-ins.",
  queries: "Log learner questions, document a response and track follow-ups.",
};

export async function TrainerDashboard({ user, query }: { user: Account; query: Query }) {
  const selected = sections.find(([key]) => key === query.section) ?? sections[0];
  const [section, title] = selected;
  const isWorkSection = section.startsWith("work-");
  const [batches, courses] = await Promise.all([
    isWorkSection ? [] : trainerBatches().find({ trainer: user._id }).sort({ name: 1, _id: 1 }).toArray(),
    isWorkSection ? [] : getCourses(),
  ]);
  const batch = batches.find((item) => item._id === query.batch) ?? batches[0];
  const scope = batch ? { trainer: user._id, batch: batch._id } : null;
  const kind = Object.hasOwn(activities, section) ? section as ActivityKind : undefined;
  const [rowList, selectedRecord, learners, counts] = await Promise.all([
    scope && kind ? trainerRecords().find({ ...scope, kind }).sort({ updatedAt: -1 }).limit(51).toArray() : [],
    scope && kind && kind !== "attendance" && query.edit ? trainerRecords().findOne({ ...scope, kind, _id: query.edit }) : null,
    batch && (kind || section === "users")
      ? accounts().find({ _id: { $in: batch.students }, role: "student" }, { projection: { name: 1 } }).sort({ name: 1 }).toArray()
      : [],
    scope && (section === "reports" || section === "overview")
      ? Promise.all(reports.map(async ([key, label]) => ({ key, label, value: await trainerRecords().countDocuments({ ...scope, kind: key }) })))
      : [],
  ]);
  const activity = kind ? activities[kind] : undefined;

  return (
    <div className="academy-dashboard">
      <header className="academy-panel academy-dashboard-hero">
        <div>
          <p className="academy-kicker">Trainer workspace</p>
          <h1 className="academy-title">{title}</h1>
          <p className="academy-description">{user.name}{batch && <> · {batch.name} · {batch.course}{batch._id.startsWith("AIQ_B_") && <> · {batch._id}</>}</>}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="academy-button academy-button-secondary" href={link("work-attendance")}>My work &amp; leave</Link>
          <form action={signOut}><button className="academy-button academy-button-secondary"><LogOut size={16} aria-hidden="true" /> Sign out</button></form>
        </div>
      </header>
      <div className="academy-workspace-grid">
        <nav className="academy-panel academy-workspace-nav trainer-nav" aria-label="Trainer sections">
          {sections.map(([key, label]) => (
            <Link key={key} href={link(key, batch?._id)} aria-current={section === key ? "page" : undefined}>
              <span>{label}</span><ChevronRight size={15} aria-hidden="true" />
            </Link>
          ))}
        </nav>
        <div className="academy-workspace-content">
          {batches.length > 0 && (
            <form action={path} className="academy-panel academy-panel-body trainer-batch-switcher">
              <input type="hidden" name="section" value={section} />
              <label className="academy-field">Current batch
                <select name="batch" defaultValue={batch?._id} key={batch?._id} className="academy-input">
                  {batches.map((item) => <option key={item._id} value={item._id}>{item.name} · {item.course}{item._id.startsWith("AIQ_B_") ? ` · ${item._id}` : ""}</option>)}
                </select>
              </label>
              <button className="academy-button academy-button-secondary">Open batch</button>
            </form>
          )}
          {section === "overview" && <>
            <WorkspaceSummary items={[
              { label: "My batches", value: batches.length, href: link("batches", batch?._id) },
              { label: "Learners in current batch", value: batch?.students.length ?? 0, href: link("users", batch?._id) },
              { label: "Class plans in current batch", value: counts.find((item) => item.key === "delivery")?.value ?? 0, href: link("delivery", batch?._id) },
            ]} />
            {!batch && <p className="academy-panel academy-panel-body">Create your first batch to start planning classes and tracking learners. <Link className="trainer-link" href={link("batches")}>Open Batch Details</Link></p>}
          </>}
          {section === "batches" && <section className="academy-panel academy-panel-body trainer-section">
            <h2>Create a batch</h2>
            <AccountForm title="Create batch" action={createBatch}>
              <Field label="Batch name" name="name" maxLength={100} />
              <label className="academy-field">Course<select required name="course" className="academy-input">
                <option value="">Select a course</option>{courses.map((course) => <option key={course.title}>{course.title}</option>)}
              </select></label>
            </AccountForm>
            {batches.length > 0 && <ul className="academy-course-list">{batches.map((item) => <li key={item._id}>
              <div><Link className="trainer-link" href={link("batches", item._id)}>{item.name}</Link><small>{item.course} · {item.students.length} learners{item._id.startsWith("AIQ_B_") && <> · <strong>{item._id}</strong></>}</small></div>
            </li>)}</ul>}
          </section>}
          {section === "users" && batch && <section className="academy-panel academy-panel-body trainer-section">
            <h2>Batch roster</h2>
            {learners.length ? <ul className="academy-course-list">{learners.map((learner) => <li key={learner._id}>
              <div><p>{learner.name}</p><small>{learner._id}</small></div>
            </li>)}</ul> : <p className="academy-empty">There are no learners in this batch.</p>}
            <AccountForm title="Add enrolled learner" action={addLearner}>
              <input type="hidden" name="batch" value={batch._id} />
              <Field label="Learner email" name="email" type="email" maxLength={254} />
            </AccountForm>
          </section>}
          {section === "courses" && <section className="academy-panel academy-panel-body trainer-section">
            <h2>Teaching catalogue</h2>
            <ul className="academy-course-list">{courses.map((course) => (
              <li key={course.title}><BookOpen size={18} aria-hidden="true" />
                <div><p>{courseLessonPath(course.title) ? <Link className="trainer-link" href={courseLessonPath(course.title)!}>{course.title}</Link> : course.title}</p><small>{course.category} · {course.level} · {course.duration} · {course.lessons} lessons</small><small>{course.text}</small></div>
              </li>
            ))}</ul>
            {!courses.length && <p className="academy-empty">No courses are available in the catalogue.</p>}
          </section>}
          {section === "reports" && batch && <section className="academy-panel academy-panel-body trainer-section">
            <h2>Batch report</h2>
            <dl className="academy-report">
              <div><dt>Learners on roster</dt><dd>{batch.students.length}</dd></div>
              {counts.map((item) => <div key={item.key}><dt><Link className="trainer-link" href={link(item.key, batch._id)}>{item.label}</Link></dt><dd>{item.value}</dd></div>)}
            </dl>
          </section>}
          {section === "forms" && <TrainerIntakePanel owner={user._id} courses={courses} selected={query.intake} batch={batch?._id} />}
          {activity && kind && batch && <>
            <section className="academy-panel academy-panel-body trainer-section" key={`${batch._id}-${kind}-${selectedRecord?._id ?? "new"}`}>
              <h2>{selectedRecord ? "Edit" : "New"} {activity.title.toLowerCase()}</h2>
              <p className="academy-empty">{descriptions[kind]}</p>
              {selectedRecord && <Link className="trainer-link" href={link(kind, batch._id)}>Cancel editing</Link>}
              <AccountForm title={activity.action} action={saveTrainerRecord}>
                <input type="hidden" name="batch" value={batch._id} />
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="record" value={selectedRecord?._id ?? ""} />
                <Field label={kind === "attendance" ? "Session title" : "Title"} name="title" defaultValue={selectedRecord?.title} maxLength={120} />
                {(activity.fields as ActivityField[]).map((field) => (
                  <TrainerField key={field.key} field={field} value={selectedRecord?.values[field.key]} learners={learners} />
                ))}
              </AccountForm>
            </section>
            <section className="academy-panel academy-panel-body trainer-section">
              <h2>{title} records</h2>
              {rowList.length ? <ul className="trainer-record-list">{rowList.slice(0, 50).map((record) => (
                <RecordRow key={record._id} record={record} editHref={kind !== "attendance" ? link(kind, batch._id, record._id) : undefined} />
              ))}</ul> : <p className="academy-empty">There are no records in this batch yet.</p>}
              {rowList.length > 50 && <p className="academy-empty">Showing the 50 most recently updated records.</p>}
            </section>
          </>}
          {!batch && ((kind && kind !== "forms") || section === "users" || section === "reports") && <p className="academy-panel academy-panel-body">
            Create a batch to use this section. <Link className="trainer-link" href={link("batches")}>Open Batch Details</Link>
          </p>}
          {section === "work-attendance" && <WorkAttendance employee={user._id} />}
          {section === "work-leave" && <WorkLeave employee={user._id} />}
          {section === "work-appraisals" && <WorkAppraisals employee={user._id} />}
          {section === "profile" && <section className="academy-panel academy-panel-body trainer-section">
            <h2>My profile</h2>
            <p className="academy-email"><span>Account email</span>{user._id}</p>
            <AccountForm action={saveProfile} title="Save profile">
              <Field label="Full name" name="name" defaultValue={user.name} minLength={2} maxLength={100} />
              {Object.entries(profileFields.trainer).map(([key, label]) => <Field key={key} label={label} name={key} defaultValue={user.profile[key]} maxLength={500} required={false} />)}
            </AccountForm>
          </section>}
        </div>
      </div>
    </div>
  );
}

function TrainerField({ field, value, learners }: { field: ActivityField; value?: string; learners: Pick<Account, "_id" | "name">[] }) {
  const { label, key, type, options, optional } = field;
  if (options || type === "learner") {
    return <label className="academy-field">{label}<select name={key} required={!optional} defaultValue={value ?? ""} className="academy-input">
      <option value="">{type === "learner" && !learners.length ? "Add learners under User first" : "Select an option"}</option>
      {options?.map((option) => <option key={option}>{option}</option>)}
      {type === "learner" && learners.map((learner) => <option key={learner._id} value={learner._id}>{learner.name} · {learner._id}</option>)}
    </select></label>;
  }
  if (type === "textarea") return <label className="academy-field">{label}
    <textarea name={key} maxLength={3000} rows={4} required={!optional} defaultValue={value} className="academy-input" />
  </label>;
  return <Field label={label} name={key} type={type} required={!optional} defaultValue={value} maxLength={3000} />;
}

function RecordRow({ record, editHref }: { record: TrainerRecord; editHref?: string }) {
  return <li>
    <header><h3>{record.title}</h3>{editHref && <Link className="trainer-link" href={editHref}>Edit<span className="sr-only"> {record.title}</span></Link>}</header>
    <dl>{(activities[record.kind].fields as ActivityField[]).map((field) => {
      const value = record.values[field.key];
      return value && <div key={field.key}><dt>{field.label}</dt><dd>{field.type === "url" && URL.parse(value)?.protocol === "https:"
        ? <a className="trainer-link" href={value}>Open resource</a> : value}</dd></div>;
    })}</dl>
  </li>;
}
