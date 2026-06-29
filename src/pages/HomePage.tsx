import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  ArrowRight,
  Stethoscope,
  UploadCloud,
  Brain,
  ClipboardList,
  Check,
  ShieldCheck,
  Activity,
  Hospital,
  Bot,
  MapPin,
  FileText,
  Flame,
  User,
  Smile,
  AlertTriangle,
  Lock,
  Zap,
} from "lucide-react";

/* ---------- count-up ---------- */
function CountUp({ end, suffix = "", duration = 1400 }: { end: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const t0 = performance.now();
            const tick = (t: number) => {
              const p = Math.min(1, (t - t0) / duration);
              setVal(Math.floor(end * (1 - Math.pow(1 - p, 3))));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [end, duration]);
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------- reveal on scroll ---------- */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setShown(true));
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(24px)",
        transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleScanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      navigate("/scan");
    } else {
      sessionStorage.setItem("redirectAfterLogin", "/scan");
      navigate("/auth");
    }
  };
  return (
    <div className="overflow-x-hidden" style={{ scrollBehavior: "smooth" }}>
      {/* ============ HERO ============ */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center py-16 lg:py-20">
        {/* dot grid bg */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: "#F0F9FF",
            backgroundImage: "radial-gradient(circle, #BAE6FD 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* blobs */}
        <div
          className="absolute -z-10 rounded-full"
          style={{
            top: "-80px",
            right: "-80px",
            width: 400,
            height: 400,
            background: "rgba(14,165,233,0.12)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute -z-10 rounded-full"
          style={{
            bottom: "-60px",
            left: "-60px",
            width: 300,
            height: 300,
            background: "rgba(99,102,241,0.10)",
            filter: "blur(80px)",
          }}
        />

        <div className="container px-4 grid lg:grid-cols-5 gap-12 items-center">
          {/* LEFT 60% */}
          <div className="lg:col-span-3 space-y-7 animate-fade-up">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
              style={{ background: "var(--hex-primary-light)", color: "var(--hex-primary-dark)" }}
            >
              <Sparkles className="h-4 w-4" />
              AI Powered Dental Detection
            </span>

            <h1
              className="font-display font-bold tracking-tight"
              style={{ fontSize: "clamp(2.25rem,5vw,3.5rem)", lineHeight: 1.05 }}
            >
              <span style={{ color: "#0F172A" }}>Detect Dental Caries</span>
              <br />
              <span className="text-gradient-primary">Before It's Too Late</span>
            </h1>

            <p className="text-lg max-w-xl" style={{ color: "hsl(var(--muted-foreground))" }}>
              Upload a tooth image and get instant AI-powered stage-wise caries detection — Healthy, Initial, Moderate,
              or Severe. Built for patients and dental professionals.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="/scan"
                onClick={handleScanClick}
                className="btn-primary-gradient inline-flex items-center gap-2 text-base cursor-pointer"
              >
                Scan Your Teeth <ArrowRight className="h-5 w-5" />
              </a>

              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] font-semibold border-2 transition-all hover:-translate-y-0.5"
                style={{ borderColor: "var(--hex-primary)", color: "var(--hex-primary-dark)", background: "white" }}
              >
                <Stethoscope className="h-5 w-5" /> Doctor Portal
              </Link>
            </div>

            <div
              className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {["No App Download Required", "Results in Seconds", "ICDAS Stage Classification"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4" style={{ color: "var(--hex-success)" }} /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT 40% — visual */}
          <div className="lg:col-span-2 relative h-[460px] md:h-[520px] animate-slide-in-right">
            {/* main mock card */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] md:w-[320px] rounded-[20px] bg-white p-5 animate-float"
              style={{
                boxShadow: "0 24px 60px rgba(14,165,233,0.25), 0 8px 24px rgba(99,102,241,0.15)",
                border: "1px solid var(--hex-border-blue)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold" style={{ color: "var(--hex-primary-dark)" }}>
                  SCAN #DA-2104
                </span>
                <span className="stage-moderate text-[10px] font-bold px-2 py-1 rounded-full">MODERATE</span>
              </div>
              {/* tooth + heatmap */}
              <div
                className="relative aspect-square rounded-2xl overflow-hidden mb-4"
                style={{ background: "radial-gradient(circle at 50% 45%, #fff 0%, #E0F2FE 60%, #BAE6FD 100%)" }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-7xl">🦷</div>
                <div
                  className="absolute"
                  style={{
                    inset: 0,
                    background:
                      "radial-gradient(circle at 55% 50%, rgba(239,68,68,0.55) 0%, rgba(245,158,11,0.35) 30%, transparent 55%)",
                    mixBlendMode: "multiply",
                  }}
                />
                <div
                  className="absolute inset-x-0 top-0 h-[3px] animate-scan-line"
                  style={{
                    background: "linear-gradient(90deg, transparent, #0EA5E9, transparent)",
                    boxShadow: "0 0 16px 4px rgba(14,165,233,0.6)",
                  }}
                />
              </div>
              {/* confidence + label row */}
              <div className="flex items-center gap-3">
                <div className="confidence-ring h-12 w-12" style={{ ["--p" as any]: 91 }}>
                  <div
                    className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
                    style={{ color: "var(--hex-primary-dark)" }}
                  >
                    91%
                  </div>
                </div>
                <div className="text-xs">
                  <div className="font-semibold" style={{ color: "#0F172A" }}>
                    AI Confidence
                  </div>
                  <div style={{ color: "hsl(var(--muted-foreground))" }}>Heatmap region detected</div>
                </div>
              </div>
            </div>

            {/* floating mini cards */}
            <FloatingCard
              className="top-4 right-2 md:right-0"
              borderColor="var(--hex-success)"
              icon={<Smile className="h-4 w-4" style={{ color: "var(--hex-success)" }} />}
              text="Healthy Detected"
              delay="0s"
            />
            <FloatingCard
              className="bottom-6 left-0"
              borderColor="var(--hex-warning)"
              icon={<AlertTriangle className="h-4 w-4" style={{ color: "var(--hex-warning)" }} />}
              text="Initial Caries"
              delay="1.1s"
            />
            <FloatingCard
              className="top-10 left-0 md:left-2"
              borderColor="var(--hex-accent)"
              icon={<Brain className="h-4 w-4" style={{ color: "var(--hex-accent)" }} />}
              text="AI Confidence: 91%"
              delay="0.5s"
            />
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="bg-white border-y" style={{ borderColor: "hsl(var(--border-blue))" }}>
        <div className="container px-4 py-8 md:py-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
          {[
            { n: 94, suffix: "%", label: "Detection Accuracy" },
            { n: 4, suffix: "", label: "ICDAS Stages" },
            { n: 2, suffix: " sec", label: "Avg Result Time" },
          ].map((s, i) => (
            <div
              key={i}
              className={`text-center ${i > 0 ? "md:border-l" : ""}`}
              style={{ borderColor: "hsl(var(--border-blue))" }}
            >
              <div className="font-display font-bold text-3xl md:text-4xl" style={{ color: "var(--hex-primary)" }}>
                <CountUp end={s.n} suffix={s.suffix} />
              </div>
              <div className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-20 bg-grid-medical">
        <div className="container px-4">
          <Reveal className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">How DentAI Works</h2>
            <p style={{ color: "hsl(var(--muted-foreground))" }}>Three simple steps to know your dental health</p>
          </Reveal>

          <div className="relative grid md:grid-cols-3 gap-8">
            {/* dashed connector */}
            <div
              className="hidden md:block absolute top-[68px] left-[16%] right-[16%] h-0 z-0"
              style={{ borderTop: "2px dashed var(--hex-primary)" }}
            />
            {[
              {
                Icon: UploadCloud,
                bg: "rgba(14,165,233,0.12)",
                color: "var(--hex-primary)",
                title: "Upload Tooth Image",
                desc: "Take a clear photo of your tooth and upload it directly in the app.",
              },
              {
                Icon: Brain,
                bg: "rgba(99,102,241,0.12)",
                color: "var(--hex-accent)",
                title: "AI Analyses Instantly",
                desc: "Our deep-learning model scans for caries patterns in seconds.",
                pulse: true,
              },
              {
                Icon: ClipboardList,
                bg: "rgba(16,185,129,0.12)",
                color: "var(--hex-success)",
                title: "Get Detailed Report",
                desc: "Receive stage classification, confidence score, heatmap and treatment advice.",
              },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="medical-card-hover relative z-10 p-7 text-center h-full">
                  <div
                    className="relative mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: s.bg }}
                  >
                    <s.Icon className="h-7 w-7" style={{ color: s.color }} />
                    {s.pulse && <span className="pulse-ring" style={{ borderColor: s.color, opacity: 0.4 }} />}
                  </div>
                  <div className="text-xs font-bold mb-1 tracking-wider" style={{ color: s.color }}>
                    STEP {i + 1}
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <Reveal className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Everything You Need</h2>
            <p style={{ color: "hsl(var(--muted-foreground))" }}>A complete AI dental toolkit, in one place</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                Icon: Brain,
                title: "AI Stage Detection",
                desc: "4-stage ICDAS aligned caries classification",
                color: "var(--hex-primary)",
                bg: "var(--hex-primary-light)",
              },
              {
                Icon: Flame,
                title: "Heatmap Visualization",
                desc: "See exactly where AI detected caries on your tooth",
                color: "#EF4444",
                bg: "#FEE2E2",
              },
              {
                Icon: FileText,
                title: "Detailed PDF Report",
                desc: "Download a full report with treatment recommendations",
                color: "var(--hex-success)",
                bg: "#D1FAE5",
              },
              {
                Icon: Stethoscope,
                title: "Doctor Portal",
                desc: "Doctors access patient history with unique patient ID",
                color: "var(--hex-accent)",
                bg: "var(--hex-accent-light)",
              },
              {
                Icon: MapPin,
                title: "Nearest Clinic Finder",
                desc: "Find dental clinics near your location instantly",
                color: "#F59E0B",
                bg: "#FEF3C7",
              },
              {
                Icon: Bot,
                title: "DentAI Chatbot",
                desc: "24/7 AI dental assistant to answer your questions",
                color: "var(--hex-primary)",
                bg: "var(--hex-primary-light)",
              },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  className="group h-full bg-white rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    border: "1px solid hsl(var(--border-blue))",
                    borderTop: "3px solid var(--hex-primary)",
                    boxShadow: "var(--shadow-md)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderTopColor = "var(--hex-accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderTopColor = "var(--hex-primary)")}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: f.bg }}
                  >
                    <f.Icon className="h-6 w-6" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FOR PATIENTS vs DOCTORS ============ */}
      <section className="py-20 bg-grid-medical">
        <div className="container px-4">
          <Reveal className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Built For Everyone</h2>
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              Whether you're managing your health or your practice
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8">
            <RoleCard
              gradient="linear-gradient(135deg,#0EA5E9,#38BDF8)"
              Icon={User}
              title="For Patients"
              points={[
                "Upload tooth image anytime",
                "Get instant AI diagnosis",
                "View stage-wise detection result",
                "Download PDF health report",
                "Find nearby dental clinics",
                "Chat with DentAI assistant",
                "View doctor's treatment notes",
              ]}
              cta="Get Started as Patient"
              ctaClass="btn-primary-gradient"
              accent="var(--hex-primary)"
              onCtaClick={handleScanClick}
            />
            <RoleCard
              gradient="linear-gradient(135deg,#6366F1,#8B5CF6)"
              Icon={Stethoscope}
              title="For Doctors"
              points={[
                "Access any patient via unique ID",
                "View full scan history",
                "Add clinical notes and treatment plan",
                "Set follow-up dates",
                "Notes sync to patient dashboard",
                "Monitor patient progress over time",
              ]}
              cta="Login as Doctor"
              ctaClass="btn-accent-gradient"
              accent="var(--hex-accent)"
            />
          </div>
        </div>
      </section>

      {/* ============ TRUST ============ */}
      <section className="relative py-20" style={{ background: "#0F172A" }}>
        <div
          className="absolute inset-0 pointer-events-none -z-0"
          style={{
            background:
              "radial-gradient(600px circle at 20% 20%, rgba(14,165,233,0.18), transparent 60%), radial-gradient(500px circle at 80% 80%, rgba(99,102,241,0.18), transparent 60%)",
          }}
        />
        <div className="container px-4 relative">
          <Reveal className="text-center mb-12">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{
                background: "rgba(14,165,233,0.15)",
                color: "#7DD3FC",
                border: "1px solid rgba(14,165,233,0.3)",
              }}
            >
              Why Trust DentAI
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: "#F0F9FF" }}>
              Built on Proven Medical Standards
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                Icon: Hospital,
                color: "#7DD3FC",
                title: "ICDAS Aligned",
                desc: "Classification follows international dental standards",
              },
              {
                Icon: Lock,
                color: "#A5B4FC",
                title: "Secure & Private",
                desc: "Patient data protected with role-based access control",
              },
              {
                Icon: Zap,
                color: "#6EE7B7",
                title: "AI + Clinical",
                desc: "Combines deep learning with rule-based clinical logic",
              },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="text-center">
                  <div
                    className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <t.Icon className="h-6 w-6" style={{ color: t.color }} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2" style={{ color: "#F0F9FF" }}>
                    {t.title}
                  </h3>
                  <p className="text-sm" style={{ color: "#94A3B8" }}>
                    {t.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0EA5E9 0%,#6366F1 100%)" }}
      >
        {/* floating tooth bg */}
        {[
          { l: "8%", t: "20%", s: 60, d: "0s" },
          { l: "85%", t: "15%", s: 48, d: "1.5s" },
          { l: "20%", t: "70%", s: 42, d: "0.8s" },
          { l: "75%", t: "65%", s: 56, d: "2.1s" },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute animate-float select-none pointer-events-none"
            style={{ left: p.l, top: p.t, fontSize: p.s, color: "rgba(255,255,255,0.10)", animationDelay: p.d }}
          >
            🦷
          </span>
        ))}
        <div className="container px-4 relative text-center">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: "white" }}>
              Ready to Detect Caries Early?
            </h2>
            <p className="max-w-2xl mx-auto mb-8" style={{ color: "rgba(255,255,255,0.9)" }}>
              Join thousands of patients using AI for better dental health
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/scan"
                onClick={handleScanClick}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-[10px] font-semibold border-2 transition-all hover:bg-white cursor-pointer"
                style={{ borderColor: "white", color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0EA5E9")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
              >
                <Activity className="h-5 w-5" /> Scan My Teeth Now
              </a>

              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-[10px] font-semibold border-2 transition-all hover:bg-white"
                style={{ borderColor: "white", color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#6366F1")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
              >
                <Stethoscope className="h-5 w-5" /> Doctor Access
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ background: "#0F172A", borderTop: "3px solid var(--hex-primary)" }}>
        <div className="container px-4 py-14 grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--hex-primary)" }}
              >
                <span className="text-xl">🦷</span>
              </div>
              <span className="font-display text-xl font-bold" style={{ color: "#F0F9FF" }}>
                DentAI
              </span>
            </div>
            <p className="text-sm" style={{ color: "#94A3B8" }}>
              AI Powered Dental Health Platform — early detection, clinical-grade reporting, accessible to everyone.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3" style={{ color: "#F0F9FF" }}>
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm" style={{ color: "#94A3B8" }}>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/tips" className="hover:text-white transition-colors">
                  Dental Tips
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Patient Login
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Doctor Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 inline-flex items-center gap-2" style={{ color: "#F0F9FF" }}>
              <ShieldCheck className="h-4 w-4" style={{ color: "var(--hex-warning)" }} /> Disclaimer
            </h4>
            <p className="text-sm" style={{ color: "#94A3B8" }}>
              DentAI is an AI-assisted tool and does not replace professional dental advice. Always consult a licensed
              dentist.
            </p>
          </div>
        </div>
        <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="container px-4 py-5 text-center text-xs" style={{ color: "#64748B" }}>
            © 2026 Dent Care AI · vijaykumar Kakde
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- helpers ---------- */
function FloatingCard({
  className,
  borderColor,
  icon,
  text,
  delay,
}: {
  className: string;
  borderColor: string;
  icon: React.ReactNode;
  text: string;
  delay: string;
}) {
  return (
    <div
      className={`absolute ${className} bg-white rounded-xl px-3 py-2 flex items-center gap-2 animate-float`}
      style={{
        borderLeft: `3px solid ${borderColor}`,
        boxShadow: "0 10px 24px rgba(14,165,233,0.18)",
        animationDelay: delay,
      }}
    >
      {icon}
      <span className="text-xs font-semibold" style={{ color: "#0F172A" }}>
        {text}
      </span>
    </div>
  );
}

function RoleCard({
  gradient,
  Icon,
  title,
  points,
  cta,
  ctaClass,
  accent,
  onCtaClick,
}: {
  gradient: string;
  Icon: any;
  title: string;
  points: string[];
  cta: string;
  ctaClass: string;
  accent: string;
  onCtaClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Reveal>
      <div
        className="bg-white rounded-[20px] overflow-hidden h-full flex flex-col"
        style={{ boxShadow: "var(--shadow-lg)", border: "1px solid hsl(var(--border-blue))" }}
      >
        <div className="h-3" style={{ background: gradient }} />
        <div className="p-8 flex-1 flex flex-col">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: `${accent}1A` }}
          >
            <Icon className="h-8 w-8" style={{ color: accent }} />
          </div>
          <h3 className="font-display text-2xl font-bold mb-5">{title}</h3>
          <ul className="space-y-3 mb-8 flex-1">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm">
                <span
                  className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: `${accent}1A` }}
                >
                  <Check className="h-3 w-3" style={{ color: accent }} />
                </span>
                <span style={{ color: "hsl(var(--foreground))" }}>{p}</span>
              </li>
            ))}
          </ul>
          {onCtaClick ? (
            <a
              href="/scan"
              onClick={onCtaClick}
              className={`${ctaClass} w-full text-center inline-block cursor-pointer`}
            >
              {cta}
            </a>
          ) : (
            <Link to="/auth" className={`${ctaClass} w-full text-center inline-block`}>
              {cta}
            </Link>
          )}
        </div>
      </div>
    </Reveal>
  );
}
