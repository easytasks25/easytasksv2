export { default } from "next-auth/middleware"

export const config = { 
  matcher: [
    "/dashboard/:path*",
    "/organizations/:path*",
    "/api/tasks/:path*",
    "/api/buckets/:path*",
    "/api/dashboard/:path*",
    "/api/organizations/:path*"
  ] 
}
