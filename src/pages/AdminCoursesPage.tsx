import { MapPin, Pencil, Plus } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { z } from "zod";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageIntro } from "../components/ui/PageIntro";
import { useAsyncData } from "../hooks/useAsyncData";
import { createCourse, getCourses, updateCourse } from "../services/courses";
import { getServiceErrorMessage } from "../services/shared";
import type { TableRow } from "../types/database";

const courseSchema = z.object({
  name: z.string().trim().min(1, "Enter a course name.").max(120, "Use 120 characters or fewer."),
  location: z.string().trim().min(1, "Enter a location.").max(160, "Use 160 characters or fewer."),
});

type Course = TableRow<"courses">;

function CourseDialog({
  course,
  onClose,
  onSaved,
}: {
  course: Course | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(course?.name ?? "");
  const [location, setLocation] = useState(course?.location ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const parsed = courseSchema.safeParse({ name, location });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter valid course details.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (course) {
        await updateCourse(course.id, parsed.data.name, parsed.data.location);
        onSaved(`${parsed.data.name} was updated.`);
      } else {
        await createCourse(parsed.data.name, parsed.data.location);
        onSaved(`${parsed.data.name} was added.`);
      }
    } catch (submissionError) {
      setError(getServiceErrorMessage(submissionError, "Unable to save the course."));
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      title={course ? "Edit course" : "Add course"}
      description="Course names and locations appear in match entry and public history."
      onClose={onClose}
      isPending={isSubmitting}
    >
      <form aria-busy={isSubmitting} className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block text-sm font-bold" htmlFor="course-name">
          Course name
          <input
            autoFocus
            id="course-name"
            className="control mt-2"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            disabled={isSubmitting}
          />
        </label>
        <label className="block text-sm font-bold" htmlFor="course-location">
          Location
          <input
            id="course-location"
            className="control mt-2"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
              setError("");
            }}
            disabled={isSubmitting}
          />
        </label>
        {error && <p className="text-sm font-semibold text-red-700" role="alert">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="button-secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save course"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function AdminCoursesPage() {
  const load = useCallback(() => getCourses(), []);
  const courses = useAsyncData(load);
  const [editingCourse, setEditingCourse] = useState<Course | null | undefined>();
  const [feedback, setFeedback] = useState("");

  function handleSaved(message: string) {
    setEditingCourse(undefined);
    setFeedback(message);
    courses.retry();
  }

  return (
    <>
      <PageIntro
        eyebrow="Administration"
        title="Courses"
        description="Manage the venues available when recording matches."
        action={
          <button className="button-primary" type="button" onClick={() => setEditingCourse(null)}>
            <Plus aria-hidden="true" size={18} />
            Add course
          </button>
        }
      />
      {feedback && <p className="mb-4 rounded-xl bg-fairway-50 px-4 py-3 text-sm font-semibold text-fairway-800" role="status">{feedback}</p>}
      {courses.status === "loading" && <LoadingState label="Loading courses" rows={5} />}
      {courses.status === "error" && (
        <ErrorState title="Unable to load courses" message="Course management data could not be loaded." onRetry={courses.retry} />
      )}
      {courses.status === "success" && courses.data.length === 0 && (
        <EmptyState title="No courses yet" description="Add a course before recording the first match." />
      )}
      {courses.status === "success" && courses.data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {courses.data.map((course) => (
            <li key={course.id} className="card flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-fairway-50 text-fairway-700">
                <MapPin aria-hidden="true" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate">{course.name}</strong>
                <span className="mt-1 block truncate text-xs text-slate-500">{course.location}</span>
              </div>
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-xl border text-fairway-800 hover:bg-fairway-50"
                onClick={() => setEditingCourse(course)}
                aria-label={`Edit ${course.name}`}
              >
                <Pencil aria-hidden="true" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {editingCourse !== undefined && (
        <CourseDialog course={editingCourse} onClose={() => setEditingCourse(undefined)} onSaved={handleSaved} />
      )}
    </>
  );
}
