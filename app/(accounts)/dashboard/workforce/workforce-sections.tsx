import { appraisals, leaves, workdays } from "@/lib/workforce";
import { AccountForm, Field } from "../../account-form";
import { clockIn, clockOut, requestLeave } from "./actions";
import { AppraisalList, LeaveList, WorkPanel, WorkdayList, workTime } from "./workforce-ui";

export async function WorkAttendance({ employee }: { employee: string }) {
  const scope = { employee };
  const [open, attendance] = await Promise.all([
    workdays().findOne({ ...scope, clockOut: { $exists: false } }, { sort: { clockIn: -1 } }),
    workdays().find(scope).sort({ clockIn: -1 }).limit(30).toArray(),
  ]);

  return (
    <WorkPanel title="Work attendance" id="attendance">
      <p className="academy-empty">{open ? `Clocked in · ${workTime(open.clockIn)}` : "You’re clocked out. Clock in when you begin work."}</p>
      <AccountForm key={open?._id ?? "closed"} action={open ? clockOut : clockIn} title={open ? "Clock out" : "Clock in"}>{null}</AccountForm>
      <WorkdayList rows={attendance} />
    </WorkPanel>
  );
}

export async function WorkLeave({ employee }: { employee: string }) {
  const requests = await leaves().find({ employee }).sort({ createdAt: -1 }).limit(30).toArray();

  return (
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
  );
}

export async function WorkAppraisals({ employee }: { employee: string }) {
  const reviews = await appraisals().find({ employee }).sort({ createdAt: -1 }).limit(30).toArray();

  return (
    <WorkPanel title="Performance appraisals" id="appraisals"><AppraisalList rows={reviews} /></WorkPanel>
  );
}
