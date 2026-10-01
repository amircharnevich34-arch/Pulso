import { notFound } from "next/navigation";
import Link from "next/link";
import { getPracticeDetail, getPracticeAttendance } from "@/lib/data/attendance";
import { AttendanceGrid } from "@/components/asistencia/attendance-grid";
import { createClient } from "@/lib/supabase/server";

export default async function PracticeAttendancePage({
  params,
}: {
  params: Promise<{ practiceId: string }>;
}) {
  const { practiceId } = await params;
  const practice = await getPracticeDetail(practiceId);
  if (!practice) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const attendees = await getPracticeAttendance(practiceId);

  return (
    <main className="p-8">
      <Link href="/asistencia" className="text-sm text-black/50 underline underline-offset-2">
        ← Asistencia
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{practice.practiceDate}</h1>
      <p className="mt-1 text-black/60">
        {practice.startTime.slice(0, 5)}–{practice.endTime.slice(0, 5)}
      </p>

      <div className="mt-8">
        {attendees.length === 0 ? (
          <p className="text-sm text-black/50">Todavía no tenés deportistas asignados.</p>
        ) : (
          <AttendanceGrid practiceId={practiceId} currentUserId={user!.id} initialAttendees={attendees} />
        )}
      </div>
    </main>
  );
}
