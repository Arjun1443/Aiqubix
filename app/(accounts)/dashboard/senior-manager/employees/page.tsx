import Link from "next/link";
import { accounts, requireAccount, roleLabels } from "@/lib/academy-accounts";
import { appraisals, employeeRoles, leaves, workdays, workEvents, type WorkEvent } from "@/lib/workforce";
import { AccountForm, Field } from "../../../account-form";
import { decideLeave, publishAppraisal, saveEmployment, setWorkAccess } from "../../workforce/actions";
import { AppraisalList, LeaveList, WorkdayList, WorkPanel, workTime } from "../../workforce/workforce-ui";

const path = "/dashboard/senior-manager/employees";
const eventLabels: Record<WorkEvent["type"], string> = {
  "sign-in": "Signed in",
  "sign-out": "Signed out",
  "sessions-revoked": "Sessions revoked",
  "access-suspended": "Sign-in access suspended",
  "access-restored": "Sign-in access restored",
};

type PageProps = { searchParams: Promise<{ employee?: string }> };

export default async function SeniorManagerEmployees({ searchParams }: PageProps) {
  await requireAccount("senior-manager");
  const { employee: selected } = await searchParams;
  const staff = { role: { $in: [...employeeRoles] }, passwordHash: { $exists: true } };
  const [employees, pending, queue] = await Promise.all([
    accounts().find(staff, { projection: { name: 1, role: 1, employment: 1, employmentStatus: 1 } }).sort({ name: 1, _id: 1 }).toArray(),
    leaves().countDocuments({ status: "Pending" }),
    leaves().find({ status: "Pending" }).sort({ start: 1, _id: 1 }).limit(20).toArray(),
  ]);
  const employee = employees.find((item) => item._id === selected) ?? employees[0];
  const active = employees.filter((item) => item.employmentStatus !== "inactive").length;
  const scope = employee ? { employee: employee._id } : null;
  const [events, attendance, requests, reviews] = await Promise.all([
    scope ? workEvents().find(scope).sort({ at: -1 }).limit(40).toArray() : [],
    scope ? workdays().find(scope).sort({ clockIn: -1 }).limit(30).toArray() : [],
    scope ? leaves().find(scope).sort({ createdAt: -1 }).limit(30).toArray() : [],
    scope ? appraisals().find(scope).sort({ createdAt: -1 }).limit(30).toArray() : [],
  ]);

  return <div className="academy-dashboard">
    <header className="academy-panel academy-dashboard-hero">
      <div><p className="academy-kicker">Senior Manager</p><h1 className="academy-title">Employee management</h1>
        <p className="academy-description">Manage staff profiles, work attendance, leave, access and performance.</p>
      </div>
      <Link className="academy-button academy-button-secondary" href="/dashboard/senior-manager">Back to dashboard</Link>
    </header>
    <div className="academy-workspace-summary">
      <div className="academy-panel academy-workspace-stat"><span>Staff accounts</span><strong>{employees.length}</strong></div>
      <div className="academy-panel academy-workspace-stat"><span>Active access</span><strong>{active}</strong></div>
      <div className="academy-panel academy-workspace-stat"><span>Pending leave requests</span><strong>{pending}</strong></div>
    </div>
    <WorkPanel title="Employee directory">
      {employees.length ? <form action={path} className="trainer-batch-switcher">
        <label className="academy-field">Select an employee<select name="employee" defaultValue={employee?._id} className="academy-input">
          {employees.map((item) => <option key={item._id} value={item._id}>{item.name} · {roleLabels[item.role]} · {item._id}</option>)}
        </select></label>
        <button className="academy-button">Open record</button>
      </form> : <p className="academy-empty">Staff appear here after activating their accounts. An admin can invite employees and trainers.</p>}
    </WorkPanel>
    {queue.length > 0 && <WorkPanel title="Pending leave queue">
      <ul className="academy-course-list">{queue.map((item) => (
        <li key={item._id}><div>
          <Link className="trainer-link" href={`${path}?employee=${encodeURIComponent(item.employee)}#employee-leave`}>
            {employees.find((staff) => staff._id === item.employee)?.name ?? item.employee}
          </Link><small>{item.category} leave · {item.start} to {item.end}</small>
        </div></li>
      ))}</ul>
      {pending > queue.length && <p className="academy-empty">Showing the next {queue.length} requests by start date.</p>}
    </WorkPanel>}
    {employee && <div className="academy-workspace-content" key={employee._id}>
      <nav className="academy-panel academy-workspace-nav" aria-label="Employee record sections">
        <a href="#employee-profile">Profile</a><a href="#employee-access">Account access</a>
        <a href="#employee-attendance">Attendance</a><a href="#employee-leave">Leave</a><a href="#employee-appraisals">Appraisals</a>
      </nav>
      <WorkPanel title={`${employee.name} · Employee profile`} id="employee-profile">
        <p className="academy-email">{employee._id} · {roleLabels[employee.role]}</p>
        <AccountForm action={saveEmployment} title="Save employee details">
          <input type="hidden" name="employee" value={employee._id} />
          <Field label="Designation" name="designation" defaultValue={employee.employment?.designation} maxLength={100} />
          <Field label="Department" name="department" defaultValue={employee.employment?.department} maxLength={100} />
          <Field label="Joining date" name="startDate" type="date" defaultValue={employee.employment?.startDate} />
        </AccountForm>
      </WorkPanel>
      <WorkPanel title="Account access and sign-in history" id="employee-access">
        <p className="academy-empty">Access · {employee.employmentStatus === "inactive" ? "Suspended" : "Active"}. Sign-out events are recorded when staff explicitly sign out.</p>
        <AccountForm action={setWorkAccess} title="Apply account action">
          <input type="hidden" name="employee" value={employee._id} />
          <label className="academy-field">Action<select name="access" className="academy-input">
            <option value="revoke">Sign out active sessions</option>
            {employee.employmentStatus === "inactive" ? <option value="active">Restore sign-in access</option> : <option value="inactive">Suspend sign-in access</option>}
          </select></label>
        </AccountForm>
        {events.length ? <ul className="academy-course-list">{events.map((event) => <li key={event._id}>
          <div><p>{eventLabels[event.type]}</p><small>{workTime(event.at)}{event.manager && ` · ${event.manager}`}</small></div>
        </li>)}</ul> : <p className="academy-empty">No sign-in or sign-out events recorded yet.</p>}
      </WorkPanel>
      <WorkPanel title="Work attendance" id="employee-attendance"><WorkdayList rows={attendance} /></WorkPanel>
      <WorkPanel title="Leave approvals" id="employee-leave">
        <LeaveList rows={requests} action={(item) => item.status === "Pending" && <AccountForm title="Record decision" action={decideLeave}>
          <input type="hidden" name="leave" value={item._id} />
          <label className="academy-field">Decision<select name="decision" required className="academy-input">
            <option value="">Select a decision</option><option>Approved</option><option>Declined</option>
          </select></label>
          <Field label="Decision note (optional)" name="note" maxLength={1000} required={false} />
        </AccountForm>} />
      </WorkPanel>
      <WorkPanel title="Performance appraisals" id="employee-appraisals">
        <AccountForm action={publishAppraisal} title="Publish appraisal">
          <input type="hidden" name="employee" value={employee._id} />
          <Field label="Review period" name="period" maxLength={100} />
          <Field label="Rating (1–5)" name="rating" type="number" min={1} max={5} />
          <label className="academy-field">Feedback<textarea required name="feedback" maxLength={2000} rows={3} className="academy-input" /></label>
          <label className="academy-field">Development goals<textarea required name="goals" maxLength={2000} rows={3} className="academy-input" /></label>
        </AccountForm>
        <AppraisalList rows={reviews} />
      </WorkPanel>
    </div>}
  </div>;
}
