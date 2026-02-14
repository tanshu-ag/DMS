import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const StatusSidebar = ({ appointment, editMode, canEdit, formData, setFormData, settings, tomorrow }) => {
  return (
    <Card className="border border-gray-200 rounded-sm shadow-none">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="font-heading font-bold text-lg tracking-tight uppercase">Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Day Outcome */}
        <DayOutcomeField
          appointment={appointment}
          editMode={editMode}
          canEdit={canEdit}
          formData={formData}
          setFormData={setFormData}
          settings={settings}
          tomorrow={tomorrow}
        />

        {/* N-1 Confirmation */}
        <div>
          <Label className="form-label">N-1 Confirmation</Label>
          {editMode && canEdit ? (
            <Select
              value={formData.n_minus_1_confirmation_status || appointment.n_minus_1_confirmation_status}
              onValueChange={(v) => setFormData({ ...formData, n_minus_1_confirmation_status: v })}
            >
              <SelectTrigger className="rounded-sm mt-1" data-testid="n1-status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settings?.n_minus_1_confirmation_statuses?.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="mt-1">{appointment.n_minus_1_confirmation_status}</p>
          )}
        </div>

        {/* Flags */}
        <div className="space-y-3">
          <FlagRow label="OTS/Recall" field="ots" appointment={appointment} editMode={editMode} canEdit={canEdit} formData={formData} setFormData={setFormData} />
          <FlagRow label="Docket Ready" field="docket_readiness" appointment={appointment} editMode={editMode} canEdit={canEdit} formData={formData} setFormData={setFormData} />
          <FlagRow label="Lost Customer" field="lost_customer" appointment={appointment} editMode={editMode} canEdit={canEdit} formData={formData} setFormData={setFormData} />
        </div>
      </CardContent>
    </Card>
  );
};

const FlagRow = ({ label, field, appointment, editMode, canEdit, formData, setFormData }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm">{label}</span>
    {editMode && canEdit ? (
      <Switch
        checked={formData[field] ?? appointment[field]}
        onCheckedChange={(v) => setFormData({ ...formData, [field]: v })}
        data-testid={`${field}-toggle`}
      />
    ) : (
      <Badge variant={appointment[field] ? "default" : "outline"} className="rounded-sm text-xs">
        {appointment[field] ? "Yes" : "No"}
      </Badge>
    )}
  </div>
);

const DayOutcomeField = ({ appointment, editMode, canEdit, formData, setFormData, settings, tomorrow }) => {
  const currentStatus = formData.appointment_status || appointment.appointment_status;

  if (editMode && canEdit) {
    return (
      <div>
        <Label className="form-label">Day Outcome</Label>
        <Select
          value={currentStatus}
          onValueChange={(v) => setFormData({ ...formData, appointment_status: v, reschedule_date: formData.reschedule_date || "", reschedule_remarks: formData.reschedule_remarks || "", cancel_reason: formData.cancel_reason || "" })}
        >
          <SelectTrigger className="rounded-sm mt-2" data-testid="status-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(settings?.appointment_day_outcomes || ["Booked", "Confirmed", "Reported", "Rescheduled", "Cancelled", "No Show"]).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentStatus === "Rescheduled" && (
          <div className="mt-3 space-y-2">
            <Label className="text-xs text-gray-500">Reschedule Date</Label>
            <Input
              type="date"
              min={tomorrow}
              value={formData.reschedule_date || ""}
              onChange={(e) => setFormData({ ...formData, reschedule_date: e.target.value })}
              className="rounded-sm text-sm"
              data-testid="reschedule-date"
            />
            <Label className="text-xs text-gray-500">Remarks</Label>
            <Textarea
              placeholder="Reschedule remarks..."
              value={formData.reschedule_remarks || ""}
              onChange={(e) => setFormData({ ...formData, reschedule_remarks: e.target.value })}
              className="rounded-sm text-sm"
              data-testid="reschedule-remarks"
            />
          </div>
        )}
        {currentStatus === "Cancelled" && (
          <div className="mt-3 space-y-2">
            <Label className="text-xs text-gray-500">Reason for Cancellation</Label>
            <Textarea
              placeholder="Enter reason..."
              value={formData.cancel_reason || ""}
              onChange={(e) => setFormData({ ...formData, cancel_reason: e.target.value })}
              className="rounded-sm text-sm"
              data-testid="cancel-reason"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Label className="form-label">Day Outcome</Label>
      <Badge className={`rounded-sm text-sm mt-2 ${currentStatus === "Confirmed" ? "bg-black text-white" : "bg-white text-black border border-dashed border-black"}`}>
        {currentStatus}
      </Badge>
      {currentStatus === "Rescheduled" && appointment.reschedule_date && (
        <p className="text-xs text-gray-500 mt-1">Rescheduled to: {appointment.reschedule_date}</p>
      )}
      {currentStatus === "Rescheduled" && appointment.reschedule_remarks && (
        <p className="text-xs text-gray-500 mt-1">{appointment.reschedule_remarks}</p>
      )}
      {currentStatus === "Cancelled" && appointment.cancel_reason && (
        <p className="text-xs text-gray-500 mt-1">Reason: {appointment.cancel_reason}</p>
      )}
    </div>
  );
};
