// import React, { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { AuthLayout } from "../components/layout/AuthLayout";
// import { Input } from "../components/ui/Input";
// import { Button } from "../components/ui/Button";
// import { Alert } from "../components/ui/Alert";
// import { useAuth } from "../context/AuthContext";
// import { brand } from "../config/brand";
// import {
//   User as UserIcon,
//   Mail,
//   Lock,
//   ArrowRight,
//   Building,
// } from "lucide-react";

// export const Register: React.FC = () => {
//   const navigate = useNavigate();
//   const { register, loading } = useAuth();

//   const [orgCode, setOrgCode] = useState("ACME");
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     if (!name || !email || !password) {
//       setError("All required fields must be completed.");
//       return;
//     }

//     try {
//       await register(name, email);
//       navigate("/dashboard");
//     } catch (err: any) {
//       setError(err.message || "Failed to create account.");
//     }
//   };

//   return (
//     <AuthLayout
//       title="Create your account"
//       subtitle={`Join your team on the ${brand.name} platform.`}
//       heroHeadline="Join your team on the road."
//       heroSubheadline="Create your account using your organization code and start collaborating with colleagues."
//     >
//       <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//         {error && (
//           <Alert
//             variant="danger"
//             title="Registration Error"
//             onClose={() => setError(null)}
//           >
//             {error}
//           </Alert>
//         )}

//         {/* Section: Organization */}
//         <div className="space-y-2">
//           <div className="text-[10px] font-extrabold text-blue-900/60 uppercase tracking-widest">
//             ORGANIZATION
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//             <Input
//               label="ORG CODE"
//               type="text"
//               required
//               placeholder="ACME"
//               value={orgCode}
//               onChange={(e) => setOrgCode(e.target.value)}
//               startIcon={<Building className="w-4 h-4" />}
//             />
//             <Input label="EMPLOYEE CODE" type="text" placeholder="Optional" />
//           </div>
//         </div>

//         {/* Section: Personal */}
//         <div className="space-y-2">
//           <div className="text-[10px] font-extrabold text-blue-900/60 uppercase tracking-widest">
//             PERSONAL
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//             <Input
//               label="FULL NAME"
//               type="text"
//               required
//               placeholder="Full name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               startIcon={<UserIcon className="w-4 h-4" />}
//             />
//             <Input
//               label="EMAIL"
//               type="email"
//               required
//               placeholder="you@company.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               startIcon={<Mail className="w-4 h-4" />}
//             />
//           </div>
//         </div>

//         {/* Section: Security */}
//         <div className="space-y-2">
//           <div className="text-[10px] font-extrabold text-blue-900/60 uppercase tracking-widest">
//             SECURITY
//           </div>
//           <Input
//             label="PASSWORD"
//             type="password"
//             required
//             placeholder="Min. 8 characters"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             startIcon={<Lock className="w-4 h-4" />}
//           />
//         </div>

//         <Button
//           type="submit"
//           variant="primary"
//           fullWidth
//           size="lg"
//           isLoading={loading}
//           rightIcon={<ArrowRight className="w-4 h-4" />}
//           className="mt-2"
//         >
//           Create account
//         </Button>

//         <div className="text-center text-xs text-slate-500 font-medium mt-2">
//           Already have an account?{" "}
//           <Link
//             to="/login"
//             className="font-bold text-[var(--brand)] hover:text-[var(--brand-hover)]"
//           >
//             Log in
//           </Link>
//         </div>
//       </form>
//     </AuthLayout>
//   );
// };
