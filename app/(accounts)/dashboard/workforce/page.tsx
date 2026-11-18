import Link from "next/link";
import { requireAccount } from "@/lib/academy-accounts";
import { appraisals, employeeRoles, leaves, workdays } from "@/lib/workforce";
import { AccountForm, Field } from "../../account-form";
import { signOut } from "../../actions";
import { clockIn, clockOut, requestLeave } from "./actions";
import { AppraisalList, LeaveList, WorkPanel, WorkdayList, workTime } from "./workforce-ui";

export default async function EmployeeWorkspace() {
  const user = await requireAccount(...employeeRoles);
  const scope = { employee: user._id };
  const [open, attendance, requests, reviews] = await Promise.all([
    workdays().findOne({ ...scope, clockOut: { $exists: false } }, { sort: { clockIn: -1 } }),
    workdays().find(scope).sort({ clockIn: -1 }).limit(30).toArray(),
    leaves().find(scope).sort({ createdAt: -1 }).limit(30).toArray(),
    appraisals().find(scope).sort({ createdAt: -1 }).limit(30).toArray(),
  ]);

  return <div className="academy-dashboard">
    <header className="academy-panel academy-dashboard-hero">
      <div><p className="academy-kicker">Employee self-service</p><h1 className="academy-title">{user.name}</h1>
        <p className="academy-description">{user.employment?.designation ?? "Employee"}{user.employment?.department ? ` · ${user.employment.department}` : ""}</p>
      </div>
      {user.role === "trainer" ? <Link className="academy-button academy-button-secondary" href="/dashboard/trainer">Trainer dashboard</Link>
        : <form action={signOut}><button className="academy-button academy-button-secondary">Sign out</button></form>}
    </header>
    <nav className="academy-panel academy-workspace-nav" aria-label="Employee sections">
      <a href="#attendance">Work attendance</a><a href="#leave">Leave</a><a href="#appraisals">Appraisals</a>
    </nav>
    <WorkPanel title="Work attendance" id="attendance">
      <p className="academy-empty">{open ? `Clocked in · ${workTime(open.clockIn)}` : "You’re clocked out. Clock in when you begin work."}</p>
      <AccountForm key={open?._id ?? "closed"} action={open ? clockOut : clockIn} title={open ? "Clock out" : "Clock in"}>{null}</AccountForm>
      <WorkdayList rows={attendance} />
    </WorkPanel>
    <WorkPanel title="Leave requests" id="leave">
      <AccountForm action={requestLeave} title="Request leave">
        <label className="academy-field">Leave type<select name="category" required className="academy-input">
          {["Casual", "Sick", "Earned", "Unpaid", "Other"].map((type) => <option key={type}>{type}</option>)}
        </select></label>
        <Field label="Start date" name="start" type="date" /><Field label="End date" name="end" type="date" />
        <label className="academy-field">Reason<textarea required name="reason" maxLength={1000} rows={3} className="academy-input" /></label>
      </AccountForm>
      <LeaveList rows={requests} />
    </WorkPanel>
    <WorkPanel title="Performance appraisals" id="appraisals"><AppraisalList rows={reviews} /></WorkPanel>
  </div>;
}
