import { redirect } from "next/navigation";

export default function StudentRegisterRedirect() {
  redirect("/auth/register");
}
