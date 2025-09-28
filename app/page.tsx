import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to local version - fully functional without database
  redirect("/local")
}
