"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  CheckCircle,
  BarChart3,
  Shield,
  Camera,
  Users,
  ArrowRight,
  Clock,
  FileCheck,
  Bell,
} from "lucide-react";
import LandingNav from "./LandingNav";

// ─── Data ──────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: FileCheck,
    title: "Submit your campaign",
    description:
      "Clients upload their advertising creatives, select billboard locations across Nigeria, and set their deployment dates — all from one dashboard.",
  },
  {
    step: "02",
    icon: CheckCircle,
    title: "Admin reviews and approves",
    description:
      "Agency administrators review submitted campaigns, check for scheduling conflicts, and approve or provide feedback — with a full audit trail.",
  },
  {
    step: "03",
    icon: Camera,
    title: "Field staff deploy and verify",
    description:
      "Staff members receive deployment tasks, install the advertisement, and upload geo-tagged photographic proof directly into the system.",
  },
  {
    step: "04",
    icon: Bell,
    title: "Clients track in real time",
    description:
      "Clients see live campaign status, deployment confirmations, and photographic evidence — no chasing emails or waiting for reports.",
  },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Location management",
    description:
      "Maintain a structured inventory of billboard sites with format classification, GPS coordinates, availability status, and daily rates.",
  },
  {
    icon: Shield,
    title: "Role-based access control",
    description:
      "Admins, staff, and clients each see only what their role permits. Permissions are enforced at every API endpoint.",
  },
  {
    icon: Camera,
    title: "Proof of deployment",
    description:
      "Field staff upload timestamped, geo-tagged photographs as verifiable evidence that every advertisement was installed correctly.",
  },
  {
    icon: BarChart3,
    title: "Campaign analytics",
    description:
      "Administrators get a real-time overview of campaign status distribution, task completion rates, and billboard utilization.",
  },
  {
    icon: Clock,
    title: "Conflict detection",
    description:
      "The system automatically prevents double-booking of billboard sites across overlapping campaign dates.",
  },
  {
    icon: Users,
    title: "Multi-stakeholder platform",
    description:
      "One platform serves clients, field staff, and agency administrators — eliminating fragmented email chains and spreadsheets.",
  },
];

const ROLES = [
  {
    role: "Client",
    color: "var(--color-primary)",
    colorLight: "var(--color-primary-light)",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80&auto=format&fit=crop",
    capabilities: [
      "Submit campaigns with creative uploads",
      "Select billboard locations on a map",
      "Track campaign status in real time",
      "View deployment proof photographs",
      "Access full campaign history",
    ],
    cta: { label: "Register as a client", href: "/register" },
  },
  {
    role: "Administrator",
    color: "#7c3aed",
    colorLight: "rgba(124, 58, 237, 0.1)",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80&auto=format&fit=crop",
    capabilities: [
      "Register your agency and get your own workspace",
      "Review and approve campaign submissions",
      "Manage billboard location inventory",
      "Assign deployment tasks to field staff",
      "Monitor analytics and manage accounts",
    ],
    cta: { label: "Register your agency", href: "/register/company" },
  },
  {
    role: "Field Staff",
    color: "var(--color-success)",
    colorLight: "rgba(16, 185, 129, 0.1)",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&auto=format&fit=crop",
    capabilities: [
      "Join via a secure invite key from your admin",
      "View assigned deployment tasks",
      "Access campaign briefs and location details",
      "Upload geo-tagged proof-of-deployment photos",
      "Receive real-time task notifications",
    ],
    cta: { label: "Join as staff", href: "/register/staff" },
  },
];

const STATS = [
  { value: "Multi", label: "Agency workspaces" },
  { value: "100%", label: "Traceable deployments" },
  { value: "0", label: "Double-bookings possible" },
  { value: "Real-time", label: "Campaign visibility" },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      <LandingNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src="https://images.unsplash.com/photo-1479660095429-2cf4e1360472?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YWR2ZXJ0aXNpbmd8ZW58MHx8MHx8fDA%3D"
            alt="Billboard advertising in a busy city"
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
          />
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,64,175,0.75) 100%)",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1200,
            margin: "0 auto",
            padding: "120px 24px 80px",
            width: "100%",
          }}
        >
          <div style={{ maxWidth: 720 }}>
            {/* Label */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "var(--radius-full)",
                padding: "6px 14px",
                marginBottom: 28,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent)", display: "block" }} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-accent)", letterSpacing: "0.04em" }}>
                OOH CAMPAIGN MANAGEMENT
              </span>
            </div>

            <h1
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                fontWeight: 400,
                color: "#ffffff",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                marginBottom: 24,
              }}
            >
              Your OOH campaigns,
              <br />
              <span style={{ color: "var(--color-accent)" }}>managed end-to-end.</span>
            </h1>

            <p
              style={{
                fontSize: "clamp(1rem, 2vw, 1.2rem)",
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.7,
                marginBottom: 40,
                maxWidth: 560,
              }}
            >
              AdVance gives every OOH agency its own private workspace — clients submit campaigns, administrators approve them, and field staff verify deployments with geo-tagged photographic proof.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/register/company"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  background: "var(--color-accent)",
                  color: "#0f172a",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  transition: "opacity var(--transition-fast)",
                }}
              >
                Register your agency
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how-it-works"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "background var(--transition-fast)",
                }}
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Stat strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 1,
              marginTop: 80,
              background: "rgba(255,255,255,0.1)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "20px 24px",
                  background: "rgba(15,23,42,0.4)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", fontFamily: "DM Serif Display, serif" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{
          padding: "100px 24px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-primary)", textTransform: "uppercase", marginBottom: 12 }}>
            The process
          </p>
          <h2
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 400,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            How AdVance works
          </h2>
          <p style={{ fontSize: "1.0625rem", color: "var(--color-text-secondary)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            From campaign submission to deployment verification — every step is
            tracked, transparent, and auditable.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 2,
          }}
        >
          {HOW_IT_WORKS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="card"
                style={{
                  padding: "32px 28px",
                  position: "relative",
                  transition: "box-shadow var(--transition-base), transform var(--transition-base)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                  (e.currentTarget as HTMLDivElement).style.transform = "";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-primary-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    style={{
                      fontFamily: "DM Serif Display, serif",
                      fontSize: "2.5rem",
                      fontWeight: 400,
                      color: "var(--color-border)",
                      lineHeight: 1,
                    }}
                  >
                    {item.step}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginBottom: 10,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                  {item.description}
                </p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: -1,
                      transform: "translateY(-50%)",
                      color: "var(--color-border)",
                      display: "flex",
                    }}
                  >
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Image break ───────────────────────────────────────────────────── */}
      <section style={{ position: "relative", height: 400, overflow: "hidden" }}>
        <Image
          src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1400&q=80&auto=format&fit=crop"
          alt="Digital billboard in urban environment"
          fill
          style={{ objectFit: "cover", objectPosition: "center 40%" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
          }}
        >
          <blockquote
            style={{
              textAlign: "center",
              maxWidth: 700,
            }}
          >
            <p
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                fontWeight: 400,
                color: "#ffffff",
                lineHeight: 1.4,
                fontStyle: "italic",
              }}
            >
              &ldquo;When advertisers cannot verify that a billboard was installed
              on time, trust erodes — and without trust, the medium&apos;s
              commercial viability is constrained.&rdquo;
            </p>
            <cite
              style={{
                display: "block",
                marginTop: 16,
                fontSize: "0.875rem",
                color: "var(--color-accent)",
                fontStyle: "normal",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              — ADVANCE RESEARCH FOUNDATION
            </cite>
          </blockquote>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section
        id="features"
        style={{
          padding: "100px 24px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-primary)", textTransform: "uppercase", marginBottom: 12 }}>
            Platform capabilities
          </p>
          <h2
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 400,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Everything your agency needs
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                style={{
                  padding: "28px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  transition: "border-color var(--transition-base), box-shadow var(--transition-base)",
                  cursor: "default",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-primary)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px var(--color-primary-light)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-primary-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-primary)",
                    marginBottom: 16,
                  }}
                >
                  <Icon size={18} />
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Roles ────────────────────────────────────────────────────────── */}
      <section
        id="roles"
        style={{
          padding: "100px 24px",
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-primary)", textTransform: "uppercase", marginBottom: 12 }}>
              Who it&apos;s for
            </p>
            <h2
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                fontWeight: 400,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Built for every stakeholder
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {ROLES.map((role) => (
              <div
                key={role.role}
                className="card"
                style={{ overflow: "hidden" }}
              >
                {/* Image */}
                <div style={{ position: "relative", height: 200 }}>
                  <Image
                    src={role.image}
                    alt={`${role.role} using AdVance`}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 60%)`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 16,
                      left: 20,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        background: role.color,
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        padding: "4px 10px",
                        borderRadius: "var(--radius-full)",
                        textTransform: "uppercase",
                      }}
                    >
                      {role.role}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "24px" }}>
                  <ul style={{ listStyle: "none", marginBottom: 24 }}>
                    {role.capabilities.map((cap) => (
                      <li
                        key={cap}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "7px 0",
                          fontSize: "0.9rem",
                          color: "var(--color-text-secondary)",
                          borderBottom: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        <CheckCircle
                          size={15}
                          style={{ color: role.color, flexShrink: 0, marginTop: 2 }}
                        />
                        {cap}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={role.cta.href}
                    className="btn-secondary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {role.cta.label}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Image
            src="https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=1400&q=80&auto=format&fit=crop"
            alt="City billboards at night"
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.88)" }} />
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 700,
            margin: "0 auto",
            padding: "100px 24px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 400,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              marginBottom: 20,
              lineHeight: 1.2,
            }}
          >
            Ready to modernize your OOH operations?
          </h2>
          <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 40 }}>
            Register your agency and get a private workspace for your team, clients, and billboard locations — all in one platform.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/register/company"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                background: "var(--color-accent)",
                color: "#0f172a",
                fontWeight: 700,
                fontSize: "0.9375rem",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
              }}
            >
              Register your agency
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.9375rem",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: "var(--color-sidebar-bg)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.875rem", fontFamily: "DM Serif Display, serif" }}>A</span>
            </div>
            <span style={{ fontFamily: "DM Serif Display, serif", fontSize: "1.125rem", color: "#ffffff" }}>
              AdVance
            </span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
            &copy; {new Date().getFullYear()} AdVance OOH Campaign Management. Lagos State University Final Year Project.
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/login" style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Sign in</Link>
            <Link href="/register/company" style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Register agency</Link>
            <Link href="/register" style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Client register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}