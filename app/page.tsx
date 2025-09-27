import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to dashboard - authentication is handled client-side
  redirect("/dashboard")
}
