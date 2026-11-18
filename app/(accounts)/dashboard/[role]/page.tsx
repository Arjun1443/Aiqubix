import { BookOpen, GraduationCap, LogOut, UserPlus, UserRound, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { accounts, profileFields, requireAccount, roleLabels, roles, type Role } from "@/lib/academy-accounts";
import { getCourses } from "@/lib/academy-courses";
import { enroll, inviteStaff, saveProfile, signOut } from "../../actions";
import { AccountForm, Field } from "../../account-form";

const roleDescriptions: Record<Role, string> = {
  student: "Manage your profile and enroll in academy courses.",
  trainer: "Update your teaching profile and browse the course catalogue.",
  "senior-manager": "View active student and trainer accounts.",
  admin: "Review academy accounts and invite trainers and senior managers.",
};

function Panel({ title, description, icon, children, flush = false }: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="academy-panel academy-directory">
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

export default async function RoleDashboard({ params }: { params: Promise<{ role: string }> }) {
  const { role: pathRole } = await params;
  const role = roles.find((candidate) => candidate === pathRole);
  if (!role) notFound();
  const user = await requireAccount(role);
  const courses = role === "student" || role === "trainer" ? await getCourses() : [];
  const canViewDirectory = role === "admin" || role === "senior-manager";
  const directory = canViewDirectory
    ? await accounts().find(
      role === "admin" ? {} : { role: { $in: ["student", "trainer"] }, passwordHash: { $exists: true } },
      { projection: { _id: 1, name: 1, role: 1, invitationExpires: 1 } },
    ).sort({ name: 1, _id: 1 }).limit(101).toArray()
    : [];
  const availableCourses = courses.filter((course) => !user.enrolledCourses?.includes(course.title));

  return (
    <div className="academy-dashboard">
      <header className="academy-panel academy-dashboard-hero">
        <div>
          <p className="academy-kicker">{roleLabels[role]} dashboard</p>
          <h1 className="academy-title">{user.name}</h1>
          <p className="academy-description">{roleDescriptions[role]}</p>
        </div>
        <form action={signOut}>
          <button className="academy-button academy-button-secondary"><LogOut size={16} aria-hidden="true" /> Sign out</button>
        </form>
      </header>
      <div className={role === "senior-manager" ? "academy-dashboard-grid academy-dashboard-grid-manager" : "academy-dashboard-grid"}>
        <Panel title="My profile" icon={<UserRound size={20} />}>
          <p className="academy-email"><span>Account email</span>{user._id}</p>
          <AccountForm action={saveProfile} title="Save profile">
            <Field label="Full name" name="name" defaultValue={user.name} minLength={2} maxLength={100} />
            {Object.entries(profileFields[role]).map(([name, label]) =>
              <Field key={name} label={label} name={name} defaultValue={user.profile[name]} maxLength={500} required={false} />,
            )}
          </AccountForm>
        </Panel>
        {role === "student" && (
          <Panel title="My courses" description="View your enrollments or choose a course." icon={<GraduationCap size={20} />}>
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
        {role === "trainer" && (
          <Panel title="Teaching catalogue" icon={<BookOpen size={20} />}>
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
          <Panel title="Invite staff" description="Create a one-time activation code for a staff member." icon={<UserPlus size={20} />}>
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
        {role === "senior-manager" && <Directory directory={directory} role={role} />}
      </div>
      {role === "admin" && <Directory directory={directory} role={role} />}
    </div>
  );
}

function Directory({ directory, role }: {
  directory: { _id: string; name: string; role: Role; invitationExpires?: Date }[];
  role: "admin" | "senior-manager";
}) {
  const isAdmin = role === "admin";
  return (
    <Panel title={isAdmin ? "Account directory" : "Students and trainers"} icon={<UsersRound size={20} />} flush>
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
