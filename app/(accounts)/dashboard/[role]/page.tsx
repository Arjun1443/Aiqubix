import { BookOpen, GraduationCap, ListChecks, LogOut, UserPlus, UserRound, UsersRound } from "lucide-react";
import { TrainerDashboard } from "./trainer-dashboard";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { accounts, profileFields, requireAccount, roleLabels, roles, tokenHash, type Role } from "@/lib/academy-accounts";
import { getCourses } from "@/lib/academy-courses";
import { enroll, inviteStaff, saveProfile, signOut, updateProgress } from "../../actions";
import { AccountForm, Field } from "../../account-form";
import { WorkspaceEmpty, WorkspaceNav, WorkspaceSummary } from "./workspace";

const roleDescriptions: Record<Role, string> = {
  student: "Manage your profile and enroll in academy courses.",
  trainer: "Update your teaching profile and browse the course catalogue.",
  "senior-manager": "View active student and trainer accounts.",
  admin: "Review academy accounts and invite trainers and senior managers.",
};

function Panel({ title, description, icon, children, id, flush = false }: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
  flush?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className="academy-panel academy-directory">
      <div className="academy-panel-heading">
        <span className="academy-icon" aria-hidden="true">{icon}</span>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {flush ? children : <div className="academy-panel-body">{children}</div>}
    </section>
  );
}

export default async function RoleDashboard({ params, searchParams }: { params: Promise<{ role: string }>; searchParams: Promise<{ section?: string; batch?: string; edit?: string; intake?: string }> }) {
  const { role: pathRole } = await params;
  const role = roles.find((candidate) => candidate === pathRole);
  if (!role) notFound();
  const user = await requireAccount(role);
  if (role === "trainer") return <TrainerDashboard user={user} query={await searchParams} />;
  const courses = await getCourses();
  const canViewDirectory = role === "admin" || role === "senior-manager";
  const directory = canViewDirectory
    ? await accounts().find(
      role === "admin" ? {} : { role: { $in: ["student", "trainer"] }, passwordHash: { $exists: true } },
      { projection: { _id: 1, name: 1, role: 1, invitationExpires: 1 } },
    ).sort({ name: 1, _id: 1 }).limit(101).toArray()
    : [];
  const availableCourses = courses.filter((course) => !user.enrolledCourses?.includes(course.title));
  const enrolled = courses.filter((course) => user.enrolledCourses?.includes(course.title));
  const progress = enrolled.map((course) => ({
    ...course,
    completed: Math.min(course.lessons, user.courseProgress?.[tokenHash(course.title)] ?? 0),
  }));
  const listed = directory.slice(0, 100);
  const summary = role === "student"
    ? [{ label: "Enrolled courses", value: user.enrolledCourses?.length ?? 0, href: "#courses" },
       { label: "Lessons logged", value: progress.reduce((total, course) => total + course.completed, 0), href: "#progress" }]
    : role === "senior-manager"
        ? [{ label: "Students shown", value: listed.filter((account) => account.role === "student").length, href: "#directory" },
           { label: "Trainers shown", value: listed.filter((account) => account.role === "trainer").length, href: "#directory" }]
        : [{ label: "Accounts shown", value: listed.length, href: "#directory" },
           { label: "Courses in catalogue", value: courses.length, href: "#courses" }];

  return (
    <div className="academy-dashboard">
      <header id="overview" className="academy-panel academy-dashboard-hero">
        <div>
          <p className="academy-kicker">{roleLabels[role]} dashboard</p>
          <h1 className="academy-title">{user.name}</h1>
          <p className="academy-description">{roleDescriptions[role]}</p>
        </div>
        <form action={signOut}>
          <button className="academy-button academy-button-secondary"><LogOut size={16} aria-hidden="true" /> Sign out</button>
        </form>
      </header>
      <div className="academy-workspace-grid">
        <WorkspaceNav role={role} />
        <div className="academy-workspace-content">
          <WorkspaceSummary items={summary} />
          {role === "student" && (
            <Panel id="courses" title="My courses" description="View your enrollments or choose a course." icon={<GraduationCap size={20} />}>
              {user.enrolledCourses?.length
                ? <ul className="academy-course-list">{user.enrolledCourses.map((title) => (
                  <li key={title}><BookOpen size={17} aria-hidden="true" /><p>{title}</p></li>
                ))}</ul>
                : <p className="academy-empty">You haven’t enrolled in any courses yet.</p>}
              {availableCourses.length > 0 && <div className="academy-enroll-form">
                <AccountForm action={enroll} title="Enroll">
                  <label className="academy-field">Available courses
                    <select name="course" className="academy-input" required>
                      {availableCourses.map((course) => <option key={course.title}>{course.title}</option>)}
                    </select>
                  </label>
                </AccountForm>
              </div>}
            </Panel>
          )}
          {role === "admin" && (
            <Panel id="courses" title="Course catalogue" icon={<BookOpen size={20} />}>
              {courses.length
                ? <ul className="academy-course-list">{courses.map((course) => (
                  <li key={course.title}>
                    <BookOpen size={17} aria-hidden="true" />
                    <div><p>{course.title}</p><small>{course.level} · {course.duration}</small></div>
                  </li>
                ))}</ul>
                : <p className="academy-empty">There are no courses in the catalogue yet.</p>}
            </Panel>
          )}
          {role === "admin" && (
            <Panel id="invitations" title="Invite staff" description="Create a one-time activation code for a staff member." icon={<UserPlus size={20} />}>
              <AccountForm action={inviteStaff} title="Generate activation code">
                <Field label="Full name" name="name" minLength={2} maxLength={100} />
                <Field label="Email" name="email" type="email" maxLength={254} />
                <label className="academy-field">Role
                  <select name="role" className="academy-input">
                    <option value="trainer">Trainer</option>
                    <option value="senior-manager">Senior Manager</option>
                  </select>
                </label>
              </AccountForm>
            </Panel>
          )}
          {canViewDirectory && <Directory directory={directory} role={role} />}
          {role === "student" && <>
            <Panel id="progress" title="Learning progress" description="Log your completed lessons for each enrolled course." icon={<ListChecks size={20} />}>
              {progress.length ? <div className="academy-progress-list">
                {progress.map((course) => <div key={course.title} className="academy-progress-item">
                  <h3>{course.title}</h3>
                  <p className="academy-empty">{course.completed} of {course.lessons} lessons logged</p>
                  <progress aria-label={`Progress for ${course.title}`} value={course.completed} max={Math.max(1, course.lessons)} />
                  <AccountForm action={updateProgress} title="Save progress">
                    <input type="hidden" name="course" value={course.title} />
                    <Field label="Completed lessons" name="completed" type="number" min={0} max={course.lessons} defaultValue={String(course.completed)} />
                  </AccountForm>
                </div>)}
              </div> : <p className="academy-empty">Enroll in a course to start tracking your progress.</p>}
            </Panel>
            <div className="academy-workspace-modules">
              <WorkspaceEmpty section="schedule" description="Live class scheduling hasn’t been configured for this workspace." />
              <WorkspaceEmpty section="assignments" description="Online assignments and quizzes aren’t available in this workspace yet." />
              <WorkspaceEmpty section="certificates" description="Certificate issuance hasn’t been configured." />
              <WorkspaceEmpty section="support" description="For help with your course or account, contact your trainer or academy administrator." />
            </div>
          </>}
          {role === "senior-manager" && <>
            <WorkspaceEmpty section="batches" description="Batch management hasn’t been configured." />
            <Panel id="reporting" title="Directory report" icon={<ListChecks size={20} />}>
              <dl className="academy-report">
                <div><dt>Active students shown</dt><dd>{listed.filter((account) => account.role === "student").length}</dd></div>
                <div><dt>Active trainers shown</dt><dd>{listed.filter((account) => account.role === "trainer").length}</dd></div>
              </dl>
              {directory.length > 100 && <p className="academy-empty">Counts reflect the first 100 directory records.</p>}
            </Panel>
          </>}
          {role === "admin" && <Panel id="settings" title="Platform status" icon={<ListChecks size={20} />}>
            <dl className="academy-report">
              <div><dt>Account database</dt><dd>Connected</dd></div>
              <div><dt>Staff activation code validity</dt><dd>24 hours</dd></div>
            </dl>
          </Panel>}
          <Panel id="profile" title="My profile" icon={<UserRound size={20} />}>
            <p className="academy-email"><span>Account email</span>{user._id}</p>
            <AccountForm action={saveProfile} title="Save profile">
              <Field label="Full name" name="name" defaultValue={user.name} minLength={2} maxLength={100} />
              {Object.entries(profileFields[role]).map(([name, label]) =>
                <Field key={name} label={label} name={name} defaultValue={user.profile[name]} maxLength={500} required={false} />,
              )}
            </AccountForm>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Directory({ directory, role }: {
  directory: { _id: string; name: string; role: Role; invitationExpires?: Date }[];
  role: "admin" | "senior-manager";
}) {
  const isAdmin = role === "admin";
  return (
    <Panel id="directory" title={isAdmin ? "Account directory" : "Students and trainers"} icon={<UsersRound size={20} />} flush>
      {directory.length ? (
        <div className="academy-table-scroll" tabIndex={0} role="region" aria-label={isAdmin ? "Account directory" : "Student and trainer directory"}>
          <table className="academy-table">
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th>{isAdmin && <th scope="col">Status</th>}</tr>
            </thead>
            <tbody>{directory.slice(0, 100).map((account) => (
              <tr key={account._id}>
                <td>{account.name}</td>
                <td>{account._id}</td>
                <td>{roleLabels[account.role]}</td>
                {isAdmin && <td><span className="academy-status">
                  {account.invitationExpires ? account.invitationExpires > new Date() ? "Invited" : "Invite expired" : "Active"}
                </span></td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="academy-panel-body academy-empty">No accounts to show yet.</p>}
      {directory.length > 100 && <p className="academy-panel-body academy-empty">Showing the first 100 accounts.</p>}
    </Panel>
  );
}
