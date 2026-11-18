import { notFound } from "next/navigation";
import { accounts, profileFields, requireAccount, roleLabels, roles } from "@/lib/academy-accounts";
import { getCourses } from "@/lib/academy-courses";
import { enroll, inviteStaff, saveProfile, signOut } from "../../actions";
import { AccountForm, Field } from "../../account-form";

const panel = "rounded-2xl border border-slate-700 bg-slate-900 p-5";
const selectClass = "mt-2 block w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white";

export default async function RoleDashboard({ params }: { params: Promise<{ role: string }> }) {
  const { role: pathRole } = await params;
  const role = roles.find((candidate) => candidate === pathRole);
  if (!role) notFound();
  const user = await requireAccount(role);
  const courses = role === "student" || role === "trainer" ? await getCourses() : [];
  const directory = role === "admin" || role === "senior-manager"
    ? await accounts().find(
      role === "admin" ? {} : { role: { $in: ["student", "trainer"] }, passwordHash: { $exists: true } },
      { projection: { _id: 1, name: 1, role: 1, invitationExpires: 1 } },
    ).sort({ name: 1, _id: 1 }).limit(101).toArray()
    : [];
  const availableCourses = courses.filter((course) => !user.enrolledCourses?.includes(course.title));

  return (
    <div className="mt-9 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-cyan-200">{roleLabels[role]} dashboard</p>
          <h1 className="text-3xl font-semibold">{user.name}</h1>
        </div>
        <form action={signOut}><button className="rounded-lg border border-slate-500 px-4 py-2">Sign out</button></form>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <section className={panel}>
          <h2 className="text-xl font-semibold">My profile</h2>
          <p className="mb-4 mt-1 break-all text-sm text-slate-300">{user._id}</p>
          <AccountForm action={saveProfile} title="Save profile">
            <Field label="Full name" name="name" defaultValue={user.name} minLength={2} maxLength={100} />
            {Object.entries(profileFields[role]).map(([name, label]) =>
              <Field key={name} label={label} name={name} defaultValue={user.profile[name]} maxLength={500} required={false} />,
            )}
          </AccountForm>
        </section>
        {role === "student" && <section className={panel}>
          <h2 className="mb-3 text-xl font-semibold">My courses</h2>
          {user.enrolledCourses?.length
            ? <ul className="mb-5 list-inside list-disc space-y-1">{user.enrolledCourses.map((title) => <li key={title}>{title}</li>)}</ul>
            : <p className="mb-5 text-slate-300">You haven’t enrolled in any courses yet.</p>}
          {availableCourses.length > 0 && <AccountForm action={enroll} title="Enroll">
            <label className="block text-sm">Available courses
              <select name="course" className={selectClass} required>
                {availableCourses.map((course) => <option key={course.title}>{course.title}</option>)}
              </select>
            </label>
          </AccountForm>}
        </section>}
        {role === "trainer" && <section className={panel}>
          <h2 className="mb-3 text-xl font-semibold">Teaching catalogue</h2>
          <ul className="space-y-3">{courses.map((course) => <li key={course.title}>
            <p className="font-medium">{course.title}</p>
            <p className="text-sm text-slate-300">{course.level} · {course.duration}</p>
          </li>)}</ul>
          {!courses.length && <p className="text-slate-300">There are no courses in the catalogue yet.</p>}
        </section>}
        {role === "admin" && <section className={panel}>
          <h2 className="mb-4 text-xl font-semibold">Invite staff</h2>
          <AccountForm action={inviteStaff} title="Generate activation code">
            <Field label="Full name" name="name" minLength={2} maxLength={100} />
            <Field label="Email" name="email" type="email" maxLength={254} />
            <label className="block text-sm">Role
              <select name="role" className={selectClass}><option value="trainer">Trainer</option><option value="senior-manager">Senior Manager</option></select>
            </label>
          </AccountForm>
        </section>}
      </div>
      {(role === "admin" || role === "senior-manager") && <section className={panel}>
        <h2 className="mb-4 text-xl font-semibold">{role === "admin" ? "Account directory" : "Students and trainers"}</h2>
        {directory.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-slate-300"><tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th>{role === "admin" && <th className="p-2">Status</th>}</tr></thead>
          <tbody>{directory.slice(0, 100).map((account) => <tr key={account._id} className="border-t border-slate-700">
            <td className="p-2">{account.name}</td><td className="p-2">{account._id}</td><td className="p-2">{roleLabels[account.role]}</td>
            {role === "admin" && <td className="p-2">{account.invitationExpires ? account.invitationExpires > new Date() ? "Invited" : "Invite expired" : "Active"}</td>}
          </tr>)}</tbody>
        </table></div> : <p className="text-slate-300">No accounts to show yet.</p>}
        {directory.length > 100 && <p className="mt-3 text-sm text-slate-300">Showing the first 100 accounts.</p>}
      </section>}
    </div>
  );
}
