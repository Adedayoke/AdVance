/**
 * app/page.tsx
 *
 * Root route — shows the landing page.
 * Authenticated users who navigate here directly
 * are handled by the landing page's own CTA logic.
 */

import LandingPage from "@/components/landing/LandingPage";

export default function Home() {
  return <LandingPage />;
}