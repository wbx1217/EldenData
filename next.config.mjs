/** @type {import('next').NextConfig} */
const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isUserSite = Boolean(owner && repo === `${owner}.github.io`);

// GitHub project pages live under /<repo>/, while <owner>.github.io and custom
// domains live at the root. NEXT_PUBLIC_BASE_PATH can override this explicitly.
const inferredBasePath =
  process.env.GITHUB_ACTIONS === "true" && repo && !isUserSite ? `/${repo}` : "";
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH !== undefined
    ? process.env.NEXT_PUBLIC_BASE_PATH
    : inferredBasePath;

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
