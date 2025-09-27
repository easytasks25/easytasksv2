import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to dashboard - authentication and organization setup is handled client-side
  redirect("/dashboard")
}
