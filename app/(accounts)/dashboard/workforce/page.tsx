import Link from "next/link";
import { requireAccount } from "@/lib/academy-accounts";
import { employeeRoles } from "@/lib/workforce";
import { signOut } from "../../actions";
import { WorkAppraisals, WorkAttendance, WorkLeave } from "./workforce-sections";

export default async function EmployeeWorkspace() {
  const user = await requireAccount(...employeeRoles);
  return <div className="academy-dashboard">
    <header className="academy-panel academy-dashboard-hero">
      <div><p className="academy-kicker">Employee self-service</p><h1 className="academy-title">{user.name}</h1>
        <p className="academy-description">{user.employment?.designation ?? "Employee"}{user.employment?.department ? ` · ${user.employment.department}` : ""}</p>
      </div>
      {user.role === "trainer" ? <Link className="academy-button academy-button-secondary" href="/dashboard/trainer?section=work-attendance">Trainer dashboard</Link>
        : <form action={signOut}><button className="academy-button academy-button-secondary">Sign out</button></form>}
    </header>
    <nav className="academy-panel academy-workspace-nav" aria-label="Employee sections">
      <a href="#attendance">Work attendance</a><a href="#leave">Leave</a><a href="#appraisals">Appraisals</a>
    </nav>
    <WorkAttendance employee={user._id} />
    <WorkLeave employee={user._id} />
    <WorkAppraisals employee={user._id} />
  </div>;
}
