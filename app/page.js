"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Brain,
  Users,
  FileCheck,
  Lock,
  Clock,
  BarChart3,
  Search,
  Award,
  CheckCircle,
  CreditCard,
  MapPin,
  GraduationCap,
  UserCheck,
  FileText,
  Building,
  Sparkles,
  Zap,
  TrendingUp,
  Eye,
  ArrowRight,
  Star,
  Activity,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(false);
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("bgvUser");
    const tokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bgvTemp="));

    if (storedUser && tokenCookie) {
      try {
        const user = JSON.parse(storedUser);
        const role = user.role?.toUpperCase();

        if (
          ["SUPER_ADMIN", "SUPER_ADMIN_HELPER", "SUPER_SPOC"].includes(role)
        ) {
          router.replace("/superadmin/dashboard");
          return;
        }

        if (["ORG_HR", "HELPER", "SPOC", "ORG_SPOC"].includes(role)) {
          router.replace("/org/dashboard");
          return;
        }
      } catch {
        localStorage.removeItem("bgvUser");
      }
    }

    setShowLanding(true);
    setRedirecting(false);
  }, [router]);

  if (redirecting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Redirecting...</p>
      </div>
    );
  }

  if (!showLanding) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
        <div className="relative">
          <div className="animate-spin h-16 w-16 rounded-full border-4 border-[#ff004f] border-t-transparent"></div>
          <div className="absolute inset-0 animate-ping h-16 w-16 rounded-full border-4 border-[#ff004f] opacity-20"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  const verificationServices = [
    {
      id: "ai_resume_screening",
      title: "🚀 AI Resume Screening",
      description:
        "Upload 100+ resumes, get top 10-20 candidates based on JD matching in seconds!",
      icon: <Sparkles className="w-6 h-6" />,
      badge: "NEW",
      featured: true,
    },
    {
      id: "pan_aadhaar_seeding",
      title: "PAN-Aadhaar Seeding",
      description: "Verify PAN and Aadhaar linkage status instantly",
      icon: <CreditCard className="w-6 h-6" />,
    },
    {
      id: "pan_verification",
      title: "PAN Verification",
      description: "Validate PAN card details and authenticity",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      id: "employment_history",
      title: "Employment History",
      description: "Comprehensive employment background verification",
      icon: <Building className="w-6 h-6" />,
    },
    {
      id: "aadhaar_to_uan",
      title: "Aadhaar to UAN",
      description: "Link and verify Aadhaar with UAN number",
      icon: <UserCheck className="w-6 h-6" />,
    },
    {
      id: "credit_report",
      title: "Credit Report",
      description: "Detailed credit history and financial background",
      icon: <TrendingUp className="w-6 h-6" />,
    },
    {
      id: "court_record",
      title: "Court Record Check",
      description: "Criminal and civil court records verification",
      icon: <Shield className="w-6 h-6" />,
    },
    {
      id: "address_verification",
      title: "Address Verification",
      description: "Physical address validation and verification",
      icon: <MapPin className="w-6 h-6" />,
    },
    {
      id: "education_check_manual",
      title: "Education Check (Manual)",
      description: "Manual verification of educational credentials",
      icon: <GraduationCap className="w-6 h-6" />,
    },
    {
      id: "supervisory_check",
      title: "Supervisory Check",
      description: "Reference checks with previous supervisors",
      icon: <Eye className="w-6 h-6" />,
    },
    {
      id: "ai_cv_validation",
      title: "AI CV Validation",
      description: "AI-powered CV authenticity and fraud detection",
      icon: <Brain className="w-6 h-6" />,
    },
    {
      id: "education_check_ai",
      title: "Education Check (AI)",
      description: "Automated AI-driven education verification",
      icon: <Activity className="w-6 h-6" />,
    },
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Get verification results in minutes, not days",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered",
      description: "Advanced AI for accurate fraud detection",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Secure & Compliant",
      description: "Bank-grade security with full compliance",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Real-Time Analytics",
      description: "Live dashboards and detailed reports",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "24/7 Monitoring",
      description: "Round-the-clock verification tracking",
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "99% Accuracy",
      description: "Industry-leading verification accuracy",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <img
                src="/logos/maihoo.png"
                alt="Maihoo"
                className="h-16 w-auto group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#services"
                className="text-gray-700 hover:text-[#ff004f] font-medium transition-colors cursor-pointer"
              >
                Services
              </a>
              <a
                href="#features"
                className="text-gray-700 hover:text-[#ff004f] font-medium transition-colors cursor-pointer"
              >
                Features
              </a>
              <a
                href="#process"
                className="text-gray-700 hover:text-[#ff004f] font-medium transition-colors cursor-pointer"
              >
                How It Works
              </a>
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-50 to-rose-50 rounded-full border border-red-200">
                <Sparkles className="w-4 h-4 text-[#ff004f] animate-pulse" />
                <span className="text-sm font-bold text-[#ff004f]">
                  AI Powered
                </span>
              </div>
            </nav>

            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Sign In
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-6 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-block mb-4">
              <span className="bg-red-100 text-red-700 text-sm font-semibold px-4 py-2 rounded-full">
                ✨ AI-Powered Background Verification
              </span>
            </div>

            <h1 className="text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Hire with{" "}
              <span className="bg-gradient-to-r from-[#ff004f] to-[#ff3366] bg-clip-text text-transparent">
                Confidence
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
              Upload 100+ resumes, get top 10-20 candidates instantly with
              AI-powered JD matching. Plus comprehensive background verification
              for modern organizations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push("/login")}
                className="px-8 py-4 bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 text-lg group"
              >
                Get Started
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("services")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl hover:shadow-xl transition-all duration-300 text-lg border border-gray-200"
              >
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 py-16 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#ff004f] to-[#ff3366] bg-clip-text text-transparent mb-2">
                  98%
                </div>
                <div className="text-gray-600 font-medium">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#ff004f] to-[#ff3366] bg-clip-text text-transparent mb-2">
                  24hrs
                </div>
                <div className="text-gray-600 font-medium">Avg Turnaround</div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Resume Screening Highlight */}
        <section className="px-6 py-16 bg-gradient-to-r from-[#ff004f] via-[#ff3366] to-[#ff004f] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          </div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-white">
                  <div className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm mb-4 animate-pulse">
                    <Star className="w-4 h-4" />
                    SUPER FEATURE
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-extrabold mb-4">
                    AI Resume Screening
                  </h2>
                  <p className="text-xl mb-6 text-white/90">
                    Upload 100+ resumes and get top 10-20 candidates instantly
                    based on JD matching!
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-3xl font-bold mb-1">100+</div>
                      <div className="text-sm text-white/80">Bulk Upload</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-3xl font-bold mb-1">10-20</div>
                      <div className="text-sm text-white/80">Top Matches</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-3xl font-bold mb-1">AI</div>
                      <div className="text-sm text-white/80">JD Matching</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-3xl font-bold mb-1">&lt;60s</div>
                      <div className="text-sm text-white/80">Processing</div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/login")}
                    className="px-8 py-4 bg-white text-[#ff004f] font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
                  >
                    Try AI Screening Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            Upload Bulk Resumes
                          </div>
                          <div className="text-sm text-white/70">
                            PDF, DOC, DOCX supported
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Brain className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            AI Analyzes JD Match
                          </div>
                          <div className="text-sm text-white/70">
                            Skills, experience, qualifications
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            Get Top Candidates
                          </div>
                          <div className="text-sm text-white/70">
                            Ranked by match score
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-semibold">Instant Results</div>
                          <div className="text-sm text-white/70">
                            Save 100+ hours of manual screening
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Services */}
        <section id="services" className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                12+ Verification Services
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprehensive verification solutions powered by AI and
                automation
              </p>
            </div>

            {/* Horizontal Scrolling Showcase */}
            <div className="relative">
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">
                {verificationServices.map((service, index) => (
                  <div
                    key={service.id}
                    className={`flex-shrink-0 ${
                      service.featured ? "w-80" : "w-64"
                    } bg-white/80 backdrop-blur-sm rounded-lg px-5 py-4 shadow-lg hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 border ${
                      service.featured
                        ? "border-[#ff004f] border-2 bg-gradient-to-br from-red-50 to-rose-50"
                        : "border-red-100/50"
                    } hover:border-red-200 hover:bg-red-50/30 group hover:-translate-y-2 snap-start animate-fade-in relative`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {service.badge && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff004f] to-[#ff3366] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                        {service.badge}
                      </div>
                    )}
                    <div
                      className={`w-11 h-11 ${
                        service.featured
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                          : "bg-gradient-to-br from-[#ff004f] to-[#ff3366]"
                      } rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 text-white ${
                        service.featured ? "animate-pulse-slow" : ""
                      }`}
                    >
                      {service.icon}
                    </div>
                    <h3
                      className={`text-base font-bold ${
                        service.featured ? "text-[#ff004f]" : "text-gray-900"
                      } mb-1.5`}
                    >
                      {service.title}
                    </h3>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {service.description}
                    </p>
                    {service.featured && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#ff004f] font-semibold">
                        <Zap className="w-4 h-4" />
                        <span>
                          Bulk Processing • JD Matching • Instant Results
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Scroll Indicator */}
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  <span>Scroll to explore all services</span>
                  <svg
                    className="w-4 h-4 animate-bounce-horizontal"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="px-6 py-20 bg-gradient-to-b from-white to-red-50"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Why Choose Us
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Industry-leading features for modern verification needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-lg px-5 py-4 shadow-lg hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 border border-red-100/50 hover:border-red-200 hover:bg-red-50/30 group hover:-translate-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-[#ff004f] to-[#ff3366] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="process" className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Simple Process
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get started in three easy steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff004f] to-[#ff3366] transform -translate-y-1/2 z-0"></div>

              {[
                {
                  step: "01",
                  title: "Select Service",
                  description: "Choose from 12+ verification services",
                  icon: <Search className="w-8 h-8" />,
                },
                {
                  step: "02",
                  title: "Submit Details",
                  description: "Upload candidate information securely",
                  icon: <FileCheck className="w-8 h-8" />,
                },
                {
                  step: "03",
                  title: "Get Results",
                  description: "Receive verified reports instantly",
                  icon: <CheckCircle className="w-8 h-8" />,
                },
              ].map((item, index) => (
                <div key={index} className="relative z-10">
                  <div
                    className="bg-white/80 backdrop-blur-sm rounded-lg px-5 py-4 shadow-lg border border-red-100/50 hover:shadow-2xl hover:shadow-red-500/20 hover:border-red-200 hover:bg-red-50/30 hover:scale-105 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-[#ff004f] to-[#ff3366] rounded-lg flex items-center justify-center mb-3 text-white shadow-lg mx-auto animate-pulse-slow">
                      {item.icon}
                    </div>
                    <div className="text-5xl font-bold text-red-100 text-center mb-2">
                      {item.step}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 text-center mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-center text-xs">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20 bg-gradient-to-r from-[#ff004f] to-[#ff3366]">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl mb-10 opacity-90">
              Join hundreds of organizations using our platform for reliable
              background verification
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-10 py-4 bg-white text-[#ff004f] font-bold rounded-xl hover:shadow-2xl transition-all duration-300 text-lg"
            >
              Start Verifying Today
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <img
                    src="/logos/maihoo.png"
                    alt="Maihoo"
                    className="h-6 w-auto"
                  />
                  <span className="font-bold text-lg text-[#ff004f]">
                    Maihoo
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  AI-powered background verification for modern organizations
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>PAN Verification</li>
                  <li>Employment Check</li>
                  <li>Education Verification</li>
                  <li>AI CV Validation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>About Us</li>
                  <li>Contact</li>
                  <li>Careers</li>
                  <li>Blog</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                  <li>Compliance</li>
                  <li>Security</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
              <p>© 2024 Maihoo. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulseSlow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        @keyframes bounceHorizontal {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(5px);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }
        .animate-bounce-horizontal {
          animation: bounceHorizontal 1.5s ease-in-out infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
