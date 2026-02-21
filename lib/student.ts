/** localStorage key for current student id (set after registration). */
export const STUDENT_ID_KEY = "hackathon360_student_id";

export function getStudentId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STUDENT_ID_KEY);
}
