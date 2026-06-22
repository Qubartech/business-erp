"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";
import { projectsApi } from "@/services/api";
import { documentsApi, settingsApi } from "@/services/featureApis";
import { useAuth } from "@/features/auth/AuthProvider";
import { 
  Loader2, ArrowLeft, FileText, Plus, Trash2, Printer, Save, 
  Building2, Users, FileCheck, DollarSign, Calendar, Info
} from "lucide-react";
import { clsx } from "clsx";
import { formatDate } from "@/lib/format";

type Milestone = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  cost: number;
};

export default function DocumentGeneratorPage() {
  const router = useRouter(); const nav = (path: any) => { if (path === -1) router.back(); else router.push(path); };
  const searchParams = useSearchParams();
  const urlProjectId = searchParams?.get("projectId") || "";
  const qc = useQueryClient();
  const { user } = useAuth();

  // Queries
  const { data: projects } = useQuery({ 
    queryKey: ["projects", "all"], 
    queryFn: () => projectsApi.list({ pageSize: 100 }) 
  });
  
  const { data: settingsData } = useQuery({ 
    queryKey: ["settings"], 
    queryFn: settingsApi.list,
    enabled: !!user
  });

  // State values
  const [templateType, setTemplateType] = useState<"agreement" | "sow">("agreement");
  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId);
  const [docTitle, setDocTitle] = useState("");
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [docId, setDocId] = useState("");

  // Company Details
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companySignee, setCompanySignee] = useState("");
  const [companySigneeTitle, setCompanySigneeTitle] = useState("");

  // Client Details
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientSignee, setClientSignee] = useState("");
  const [clientSigneeTitle, setClientSigneeTitle] = useState("");

  // Specifics
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("50% upfront payment upon execution of this agreement, and 50% upon final delivery and client approval.");
  const [governingLaw, setGoverningLaw] = useState("State of New York");
  const [customTerms, setCustomTerms] = useState(
    "1. Confidentiality: Both parties agree to keep all project details confidential. \n2. Intellectual Property: Upon full payment, all deliverables and IP rights transfer to the Client. \n3. Termination: Either party may terminate this agreement with 14 days written notice."
  );

  // Milestones (for SOW)
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: "1", title: "Milestone 1: Project Kickoff & Design UI", description: "Design Figma wireframes and architecture planning.", dueDate: "", cost: 1500 },
    { id: "2", title: "Milestone 2: Frontend & Backend Core Development", description: "Implement API integrations, routes, and data connections.", dueDate: "", cost: 2500 },
    { id: "3", title: "Milestone 3: Review & Final Deployment", description: "Final testing, deployment to production host, and handoff.", dueDate: "", cost: 1000 },
  ]);

  // Generate a random document ID on mount
  useEffect(() => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setDocId(`DOC-${new Date().getFullYear()}-${random}`);
  }, []);

  // Update Project Specific Details on Selection
  const selectedProjectObj = projects?.items.find(p => p.id === selectedProjectId);
  
  useEffect(() => {
    if (selectedProjectObj) {
      setDocTitle(`${selectedProjectObj.name} ${templateType === "agreement" ? "Client Agreement" : "Statement of Work"}`);
      setScopeOfWork(selectedProjectObj.description || "No project description provided. Edit this area to specify the detailed scope of work.");
      if (selectedProjectObj.startDate) {
        setDocDate(selectedProjectObj.startDate.slice(0, 10));
      }
    } else {
      setDocTitle(`Untitled ${templateType === "agreement" ? "Client Agreement" : "Statement of Work"}`);
      setScopeOfWork("");
    }
  }, [selectedProjectId, selectedProjectObj, templateType]);

  // Pre-fill Company settings from database
  useEffect(() => {
    if (settingsData?.items) {
      const getVal = (key: string, fallback: string) => {
        return settingsData.items.find(s => s.key === key)?.value || fallback;
      };
      setCompanyName(getVal("company.name", "Qubartech"));
      setCompanyAddress(getVal("company.address", "123 Business Rd, Dhaka, Bangladesh"));
      setCompanyEmail(getVal("company.email", "hello@qubartech.com"));
      setCompanyPhone(getVal("company.phone", "+880 1234 5678"));
      setCompanySignee(getVal("company.representative", user?.name || "Administrator"));
      setCompanySigneeTitle(getVal("company.designation", user?.role === "admin" ? "CEO & Founder" : "Project Director"));
    } else {
      setCompanyName("Qubartech");
      setCompanyAddress("123 Business Rd, Dhaka, Bangladesh");
      setCompanyEmail("hello@qubartech.com");
      setCompanyPhone("+880 1234 5678");
      setCompanySignee(user?.name || "Administrator");
      setCompanySigneeTitle(user?.role === "admin" ? "CEO & Founder" : "Project Director");
    }
  }, [settingsData, user]);

  // Handle Milestones additions
  const addMilestone = () => {
    const newId = String(Date.now());
    setMilestones([
      ...milestones, 
      { id: newId, title: `Milestone ${milestones.length + 1}`, description: "", dueDate: "", cost: 0 }
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, val: string | number) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const totalCost = milestones.reduce((sum, m) => sum + Number(m.cost || 0), 0);

  // Compile standalone HTML for storage and preview download
  const generateHTMLContent = () => {
    const isSow = templateType === "sow";
    
    // Milestones HTML
    const milestonesRowsHtml = milestones.map(m => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #1e293b;">
          ${m.title}
          ${m.description ? `<br/><span style="font-size: 11px; font-weight: normal; color: #64748b;">${m.description}</span>` : ""}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
          ${m.dueDate ? formatDate(m.dueDate) : "—"}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: bold; color: #0f172a;">
          $${Number(m.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
    `).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    body {
      font-family: Georgia, serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 40px auto;
      max-width: 800px;
      padding: 0 20px;
    }
    h1 {
      font-size: 26px;
      text-align: center;
      margin-top: 30px;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0f172a;
    }
    .subtitle {
      text-align: center;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 40px;
      font-family: sans-serif;
      font-weight: 500;
    }
    .letterhead {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 15px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-family: sans-serif;
    }
    .company-info {
      font-size: 12px;
      color: #334155;
    }
    .company-name {
      font-size: 18px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .doc-meta {
      text-align: right;
      font-size: 12px;
      color: #475569;
    }
    .parties-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-family: sans-serif;
    }
    .parties-table td {
      width: 50%;
      vertical-align: top;
      padding: 15px;
      border: 1px solid #cbd5e1;
      background-color: #f8fafc;
    }
    .party-title {
      font-size: 11px;
      font-weight: bold;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .party-name {
      font-size: 14px;
      font-weight: bold;
      color: #0f172a;
    }
    .party-details {
      font-size: 12px;
      color: #475569;
      white-space: pre-wrap;
      margin-top: 5px;
    }
    h3 {
      font-size: 16px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 5px;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #0f172a;
      text-transform: uppercase;
      font-family: sans-serif;
      font-weight: 700;
    }
    p, li {
      font-size: 14px;
      margin-bottom: 15px;
      text-align: justify;
    }
    .pre-text {
      white-space: pre-wrap;
      font-family: Georgia, serif;
      font-size: 14px;
    }
    .milestones-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-family: sans-serif;
    }
    .milestones-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-size: 12px;
      font-weight: bold;
      text-align: left;
      padding: 10px;
      border-bottom: 2px solid #cbd5e1;
    }
    .milestones-table td {
      border-bottom: 1px solid #e2e8f0;
      padding: 10px;
    }
    .signature-section {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      font-family: sans-serif;
    }
    .signature-block {
      width: 45%;
    }
    .signature-line {
      border-bottom: 1px solid #0f172a;
      height: 45px;
      margin-bottom: 10px;
    }
    .signature-details {
      font-size: 12px;
      color: #334155;
    }
    @media print {
      body {
        margin: 20mm;
      }
    }
  </style>
</head>
<body>
  <div class="letterhead">
    <div class="company-info">
      <div class="company-name">${companyName}</div>
      <div>${companyAddress}</div>
      <div>Email: ${companyEmail} | Tel: ${companyPhone}</div>
    </div>
    <div class="doc-meta">
      <div style="font-weight: bold; font-size: 14px; color: #0f172a;">${isSow ? "STATEMENT OF WORK" : "SERVICES AGREEMENT"}</div>
      <div>Ref: ${docId}</div>
      <div>Date: ${formatDate(docDate)}</div>
    </div>
  </div>

  <h1>${isSow ? "Statement of Work" : "Client Services Agreement"}</h1>
  <div class="subtitle">Agreement Ref: ${docId}</div>

  <p>
    This document constitutes a binding agreement between the parties described below. 
    ${isSow 
      ? `This Statement of Work ("SOW") is executed pursuant to the terms of the Services Agreement between the parties, and defines the specific milestones, deliverables, and payment schedule for the project **${selectedProjectObj?.name || "General Client Work"}**.`
      : `This Services Agreement (the "Agreement") is entered into as of **${formatDate(docDate)}**, by and between the Service Provider and the Client named below. The parties agree to the terms, scope of work, and fees detailed herein.`
    }
  </p>

  <table class="parties-table">
    <tr>
      <td>
        <div class="party-title">Service Provider</div>
        <div class="party-name">${companyName}</div>
        <div class="party-details">
Address: ${companyAddress}
Contact: ${companyEmail} | ${companyPhone}
Representative: ${companySignee} (${companySigneeTitle})
        </div>
      </td>
      <td>
        <div class="party-title">Client</div>
        <div class="party-name">${clientName || "—"}</div>
        <div class="party-details">
Address: ${clientAddress || "—"}
Contact: ${clientEmail || "—"} | ${clientPhone || "—"}
Representative: ${clientSignee || "—"} (${clientSigneeTitle || "—"})
        </div>
      </td>
    </tr>
  </table>

  <h3>1. Project & Scope of Work</h3>
  <div class="pre-text">${scopeOfWork || "No detailed scope of work specified."}</div>

  ${isSow ? `
    <h3>2. Deliverables & Payment Milestones</h3>
    <p>The project deliverables shall be completed in stages according to the following schedule. Each milestone fee shall be invoiced upon delivery and client approval of the corresponding items:</p>
    <table class="milestones-table">
      <thead>
        <tr>
          <th>Milestone / Deliverable</th>
          <th>Est. Due Date</th>
          <th style="text-align: right;">Milestone Fee</th>
        </tr>
      </thead>
      <tbody>
        ${milestonesRowsHtml}
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td colspan="2" style="padding: 12px 10px; border-top: 2px solid #cbd5e1; text-align: right; font-size: 13px; color: #0f172a;">Total Contract Value:</td>
          <td style="padding: 12px 10px; border-top: 2px solid #cbd5e1; text-align: right; font-size: 14px; color: #0f172a;">
            $${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        </tr>
      </tbody>
    </table>
  ` : `
    <h3>2. Fees & Payment Terms</h3>
    <p class="pre-text">${paymentTerms}</p>
    
    <h3>3. Governing Law</h3>
    <p>This Agreement and all disputes arising hereunder shall be governed by, and construed in accordance with, the laws of the <strong>${governingLaw}</strong>, without regard to conflict of law principles.</p>
  `}

  <h3>${isSow ? "3" : "4"}. General Terms & Conditions</h3>
  <div class="pre-text" style="font-size: 13px; color: #334155; line-height: 1.5; background-color: #f8fafc; padding: 15px; border: 1px dashed #cbd5e1; border-radius: 4px;">${customTerms}</div>

  <p style="margin-top: 30px;">IN WITNESS WHEREOF, the parties hereto have executed this document as of the date first written above.</p>

  <div class="signature-section">
    <div class="signature-block">
      <div class="party-title">For Service Provider</div>
      <div class="signature-line"></div>
      <div class="signature-details">
        <strong>Authorized Signature</strong><br/>
        Name: ${companySignee}<br/>
        Title: ${companySigneeTitle}<br/>
        Date: ________________________
      </div>
    </div>
    <div class="signature-block">
      <div class="party-title">For Client</div>
      <div class="signature-line"></div>
      <div class="signature-details">
        <strong>Authorized Signature</strong><br/>
        Name: ${clientSignee || "________________________"}<br/>
        Title: ${clientSigneeTitle || "________________________"}<br/>
        Date: ________________________
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  // Upload/Save generated document to backend Supabase storage
  const saveToErp = useMutation({
    mutationFn: async () => {
      const htmlContent = generateHTMLContent();
      const blob = new Blob([htmlContent], { type: "text/html" });
      const filename = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${docId.toLowerCase()}.html`;
      const file = new File([blob], filename, { type: "text/html" });

      const fd = new FormData();
      fd.append("title", docTitle);
      fd.append("category", templateType === "agreement" ? "Agreement" : "Statement of Work");
      if (selectedProjectId) {
        fd.append("projectId", selectedProjectId);
      }
      fd.append("file", file);

      return documentsApi.upload(fd);
    },
    onSuccess: () => {
      toast.success("Document generated and saved to ERP storage successfully!");
      qc.invalidateQueries({ queryKey: ["documents"] });
      // Redirect back to documents or previous page
      nav("/documents");
    },
    onError: (e: Error) => {
      toast.error(`Failed to save document: ${e.message}`);
    }
  });

  // Print using native window.print with custom stylesheet injection
  const handlePrint = () => {
    // Add print style element to head
    const styleId = "print-document-style-override";
    let printStyle = document.getElementById(styleId);
    if (!printStyle) {
      printStyle = document.createElement("style");
      printStyle.id = styleId;
      printStyle.innerHTML = `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area-container, #print-area-container * {
            visibility: visible !important;
          }
          #print-area-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          /* Hide UI/nav elements */
          header, aside, nav, button, form, .no-print {
            display: none !important;
          }
        }
      `;
      document.head.appendChild(printStyle);
    }
    
    window.print();
  };

  // Reset form or clear Client Details
  const resetClientForm = () => {
    setClientName("");
    setClientAddress("");
    setClientEmail("");
    setClientPhone("");
    setClientSignee("");
    setClientSigneeTitle("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header with Back Navigation */}
      <div className="flex items-center gap-2 mb-2 no-print">
        <button 
          onClick={() => nav(-1)}
          className="btn-secondary p-2 rounded-xl flex items-center justify-center shrink-0"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Document Generator</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Generate structured contracts and statements of work from templates</p>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-[450px,1fr] gap-8 items-start">
        
        {/* Left Control Panel (Forms) */}
        <form onSubmit={(e) => e.preventDefault()} className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200/50 dark:border-white/[0.08] shadow-md space-y-6 no-print overflow-y-auto max-h-[85vh] scrollbar-thin">
          
          {/* Template Selector */}
          <div>
            <label className="label font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-brand-600" />
              1. Document Template
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200/40 dark:border-white/[0.04]">
              <button
                type="button"
                onClick={() => setTemplateType("agreement")}
                className={clsx(
                  "py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  templateType === "agreement"
                    ? "bg-white dark:bg-zinc-800 text-brand-700 dark:text-brand-400 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350"
                )}
              >
                Client Agreement
              </button>
              <button
                type="button"
                onClick={() => setTemplateType("sow")}
                className={clsx(
                  "py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  templateType === "sow"
                    ? "bg-white dark:bg-zinc-800 text-brand-700 dark:text-brand-400 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350"
                )}
              >
                Statement of Work (SOW)
              </button>
            </div>
          </div>

          {/* Project & Basic Info */}
          <div className="space-y-3">
            <label className="label font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              2. Basic Information
            </label>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Associated ERP Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="input rounded-xl focus:ring-brand-500"
              >
                <option value="">No project (General / Standalone)</option>
                {projects?.items.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="input rounded-xl focus:ring-brand-500"
                placeholder="e.g. Services Agreement"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Agreement Date</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="input rounded-xl focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Document Ref ID</label>
                <input
                  type="text"
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  className="input rounded-xl focus:ring-brand-500"
                  placeholder="DOC-YYYY-XXXX"
                />
              </div>
            </div>
          </div>

          {/* Company Details (Pre-filled from Settings, Editable) */}
          <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-white/[0.06]">
            <label className="label font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-500" />
              3. Service Provider Details (Us)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Tel / Phone</label>
                <input type="text" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="input rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Address</label>
              <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="input rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Signee Name</label>
                <input type="text" value={companySignee} onChange={(e) => setCompanySignee(e.target.value)} className="input rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Signee Designation</label>
                <input type="text" value={companySigneeTitle} onChange={(e) => setCompanySigneeTitle(e.target.value)} className="input rounded-xl" />
              </div>
            </div>
          </div>

          {/* Client Details (Form Input) */}
          <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-white/[0.06]">
            <div className="flex justify-between items-center mb-1">
              <label className="label font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-0">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                4. Client Details (Customer)
              </label>
              <button 
                type="button" 
                onClick={resetClientForm}
                className="text-[10px] text-slate-450 hover:text-red-500 transition-colors font-semibold"
              >
                Clear Client
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Client Corp Name</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  className="input rounded-xl focus:ring-blue-500"
                  placeholder="e.g. Acme Corp" 
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)} 
                  className="input rounded-xl focus:ring-blue-500"
                  placeholder="e.g. +1 (555) 123" 
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Client Address</label>
              <input 
                type="text" 
                value={clientAddress} 
                onChange={(e) => setClientAddress(e.target.value)} 
                className="input rounded-xl focus:ring-blue-500"
                placeholder="e.g. 456 Innovation Road" 
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Client Email</label>
              <input 
                type="email" 
                value={clientEmail} 
                onChange={(e) => setClientEmail(e.target.value)} 
                className="input rounded-xl focus:ring-blue-500"
                placeholder="e.g. billing@acme.com" 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Client Signee Name</label>
                <input 
                  type="text" 
                  value={clientSignee} 
                  onChange={(e) => setClientSignee(e.target.value)} 
                  className="input rounded-xl focus:ring-blue-500"
                  placeholder="e.g. Jane Smith" 
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Signee Designation</label>
                <input 
                  type="text" 
                  value={clientSigneeTitle} 
                  onChange={(e) => setClientSigneeTitle(e.target.value)} 
                  className="input rounded-xl focus:ring-blue-500"
                  placeholder="e.g. Director" 
                />
              </div>
            </div>
          </div>

          {/* Scope of Work (Shared) */}
          <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-white/[0.06]">
            <label className="label font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
              <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
              5. Project Scope & Deliverables
            </label>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Detailed Scope of Work</label>
              <textarea
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                className="input rounded-xl min-h-[140px] font-mono text-xs focus:ring-brand-500 leading-normal"
                placeholder="List project deliverables, descriptions, and boundaries..."
              />
            </div>
          </div>

          {/* Template Specifics */}
          {templateType === "agreement" ? (
            <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-white/[0.06]">
              <label className="label font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                6. Payment Terms & Legals
              </label>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Compensation / Fee Schedule</label>
                <textarea
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="input rounded-xl min-h-[70px] text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-450 block mb-1">Governing Law Jurisdiction</label>
                <input
                  type="text"
                  value={governingLaw}
                  onChange={(e) => setGoverningLaw(e.target.value)}
                  className="input rounded-xl text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-white/[0.06]">
              <div className="flex justify-between items-center mb-1">
                <label className="label font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-0">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  6. Milestones & Pricing
                </label>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="btn-secondary text-[10px] py-1 px-2.5 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Row
                </button>
              </div>

              {/* Dynamic Milestones Editor */}
              <div className="space-y-3">
                {milestones.map((m, idx) => (
                  <div key={m.id} className="p-3 bg-slate-50 dark:bg-zinc-950/40 rounded-xl border border-slate-200/50 dark:border-white/[0.04] space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => removeMilestone(m.id)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Remove milestone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-[10px] font-bold text-slate-450 uppercase">Item #{idx + 1}</div>
                    
                    <div>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => updateMilestone(m.id, "title", e.target.value)}
                        placeholder="Milestone Title (e.g. Design Wireframes)"
                        className="input text-xs font-semibold py-1 rounded-lg"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={m.description}
                        onChange={(e) => updateMilestone(m.id, "description", e.target.value)}
                        placeholder="Deliverable Description (optional)"
                        className="input text-[11px] py-1 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="date"
                          value={m.dueDate}
                          onChange={(e) => updateMilestone(m.id, "dueDate", e.target.value)}
                          className="input text-xs py-1 rounded-lg"
                        />
                      </div>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                          <span className="text-[11px] font-bold text-slate-400">$</span>
                        </div>
                        <input
                          type="number"
                          value={m.cost || ""}
                          onChange={(e) => updateMilestone(m.id, "cost", Number(e.target.value))}
                          placeholder="Cost"
                          className="input text-xs py-1 pl-5 rounded-lg text-right font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {milestones.length === 0 && (
                  <div className="text-center p-4 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-400 italic">
                    No milestones defined. Click "Add Row" to start adding pricing deliverables.
                  </div>
                )}

                <div className="flex justify-between items-center p-2.5 bg-brand-50/40 dark:bg-brand-950/10 rounded-xl border border-brand-100/50 dark:border-brand-900/30 text-xs">
                  <span className="font-bold text-slate-600 dark:text-zinc-400">Total Contract Value:</span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                    ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* General Terms Accordion/Text Box */}
          <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-white/[0.06]">
            <label className="label font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
              General Terms & Conditions
            </label>
            <div>
              <textarea
                value={customTerms}
                onChange={(e) => setCustomTerms(e.target.value)}
                className="input rounded-xl min-h-[90px] text-xs font-mono leading-normal"
                placeholder="Include general terms such as IP transfer, termination, or confidentiality clauses..."
              />
            </div>
          </div>

        </form>

        {/* Right Preview Panel (Paper View) */}
        <div className="space-y-4 flex flex-col items-center">
          
          {/* Action Bar */}
          <div className="w-full flex justify-between items-center no-print bg-white dark:bg-zinc-900/60 dark:backdrop-blur-md p-3.5 rounded-xl border border-slate-200/50 dark:border-white/[0.08] shadow-sm">
            <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Live Print Preview</div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="btn-secondary text-xs flex items-center gap-1.5"
                title="Print or Save to PDF via Browser"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / PDF
              </button>
              <button
                onClick={() => saveToErp.mutate()}
                disabled={saveToErp.isPending}
                className="btn-primary text-xs flex items-center gap-1.5"
                title="Upload HTML document to ERP Database"
              >
                {saveToErp.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save to ERP
              </button>
            </div>
          </div>

          {/* Realistic Mock Paper */}
          <div className="w-full bg-slate-200/50 dark:bg-zinc-950/30 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] overflow-x-auto">
            
            {/* The Print Sheet container */}
            <div 
              id="print-area-container"
              className="bg-white text-slate-900 mx-auto p-10 sm:p-14 shadow-lg border border-slate-300 rounded-sm font-serif text-left select-text max-w-[800px] min-h-[1050px] space-y-6 leading-relaxed text-sm shadow-slate-300/40"
              style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            >
              {/* Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end gap-4" style={{ fontFamily: 'sans-serif' }}>
                <div className="space-y-1">
                  <div className="font-extrabold text-base text-slate-900 tracking-wide uppercase">{companyName}</div>
                  <div className="text-[11px] text-slate-500">{companyAddress}</div>
                  <div className="text-[11px] text-slate-500">Email: {companyEmail} | Tel: {companyPhone}</div>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="font-bold text-xs text-slate-900 tracking-wider uppercase">{templateType === "sow" ? "STATEMENT OF WORK" : "SERVICES AGREEMENT"}</div>
                  <div className="text-[10px] text-slate-500">Ref: <span className="font-mono">{docId}</span></div>
                  <div className="text-[10px] text-slate-500">Date: {formatDate(docDate)}</div>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center pt-4 pb-2">
                <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
                  {templateType === "sow" ? "Statement of Work" : "Client Services Agreement"}
                </h2>
                <div className="text-[10px] text-slate-400 font-semibold tracking-widest mt-1" style={{ fontFamily: 'sans-serif' }}>
                  REF ID: {docId}
                </div>
              </div>

              {/* Intro Text */}
              <p className="indent-8 text-slate-800 text-justify text-sm">
                This document constitutes a binding agreement between the parties described below. 
                {templateType === "sow" ? (
                  <>
                    This Statement of Work ("SOW") is executed pursuant to the terms of the Services Agreement between the parties, and defines the specific milestones, deliverables, and payment schedule for the project <strong>{selectedProjectObj?.name || "General Client Work"}</strong>.
                  </>
                ) : (
                  <>
                    This Services Agreement (the "Agreement") is entered into as of <strong>{formatDate(docDate)}</strong>, by and between the Service Provider and the Client named below. The parties agree to the terms, scope of work, and fees detailed herein.
                  </>
                )}
              </p>

              {/* Parties Box */}
              <div className="grid grid-cols-2 gap-4 border border-slate-300 bg-slate-50/50 p-4 rounded" style={{ fontFamily: 'sans-serif' }}>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Provider (Us)</div>
                  <div className="font-bold text-xs text-slate-900">{companyName}</div>
                  <div className="text-[11px] text-slate-600 space-y-0.5 mt-1">
                    <div>Address: {companyAddress}</div>
                    <div>Contact: {companyEmail} | {companyPhone}</div>
                    <div>Representative: {companySignee} ({companySigneeTitle})</div>
                  </div>
                </div>
                <div className="space-y-1 border-l border-slate-200 pl-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client (Customer)</div>
                  <div className="font-bold text-xs text-slate-900">{clientName || "—"}</div>
                  <div className="text-[11px] text-slate-600 space-y-0.5 mt-1">
                    <div>Address: {clientAddress || "—"}</div>
                    <div>Contact: {clientEmail || "—"} | {clientPhone || "—"}</div>
                    <div>Representative: {clientSignee || "—"} ({clientSigneeTitle || "—"})</div>
                  </div>
                </div>
              </div>

              {/* 1. Scope Section */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mt-4" style={{ fontFamily: 'sans-serif' }}>
                  1. Project & Scope of Work
                </h3>
                <div className="whitespace-pre-wrap text-slate-800 text-justify text-sm leading-relaxed">
                  {scopeOfWork || "No detailed scope of work specified."}
                </div>
              </div>

              {/* 2. Dynamic Milestone Table or Fee Schedule */}
              {templateType === "agreement" ? (
                <>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mt-6" style={{ fontFamily: 'sans-serif' }}>
                      2. Fees & Payment Terms
                    </h3>
                    <div className="whitespace-pre-wrap text-slate-800 text-justify text-sm">
                      {paymentTerms}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mt-6" style={{ fontFamily: 'sans-serif' }}>
                      3. Governing Law
                    </h3>
                    <p className="text-slate-800 text-sm">
                      This Agreement and all disputes arising hereunder shall be governed by, and construed in accordance with, the laws of the <strong>{governingLaw}</strong>, without regard to conflict of law principles.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mt-6" style={{ fontFamily: 'sans-serif' }}>
                    2. Deliverables & Payment Milestones
                  </h3>
                  <p className="text-slate-800 text-sm">
                    The project deliverables shall be completed in stages according to the following schedule. Each milestone fee shall be invoiced upon delivery and client approval of the corresponding items:
                  </p>
                  
                  <table className="w-full border-collapse text-left mt-2" style={{ fontFamily: 'sans-serif' }}>
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-350 text-[11px] font-bold text-slate-700">
                        <th className="p-2.5">Milestone / Deliverable Description</th>
                        <th className="p-2.5 w-[140px]">Est. Due Date</th>
                        <th className="p-2.5 w-[120px] text-right">Fee (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {milestones.map((m) => (
                        <tr key={m.id} className="text-xs text-slate-800">
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{m.title}</div>
                            {m.description && <div className="text-[10px] text-slate-500 font-normal mt-0.5">{m.description}</div>}
                          </td>
                          <td className="p-2.5 text-slate-650">{m.dueDate ? formatDate(m.dueDate) : "—"}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">${Number(m.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/70 border-t-2 border-slate-300 font-bold text-slate-900">
                        <td colSpan={2} className="p-2.5 text-right text-xs uppercase tracking-wider text-slate-500">Total Contract Value:</td>
                        <td className="p-2.5 text-right text-sm">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. General Terms */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mt-6" style={{ fontFamily: 'sans-serif' }}>
                  {templateType === "sow" ? "3" : "4"}. General Terms & Conditions
                </h3>
                <div className="whitespace-pre-wrap text-slate-700 text-justify text-xs leading-relaxed bg-slate-50 border border-slate-200 p-4 rounded">
                  {customTerms}
                </div>
              </div>

              {/* Signature Block */}
              <div className="pt-8 space-y-8" style={{ pageBreakInside: 'avoid' }}>
                <p className="text-slate-800 text-sm">
                  IN WITNESS WHEREOF, the parties hereto have executed this document as of the date first written above.
                </p>
                
                <div className="grid grid-cols-2 gap-12 pt-4" style={{ fontFamily: 'sans-serif' }}>
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">For Service Provider</div>
                    <div className="border-b border-slate-900 h-10 w-full"></div>
                    <div className="text-[10px] text-slate-600 space-y-0.5">
                      <div>Authorized Signature</div>
                      <div>Name: {companySignee}</div>
                      <div>Title: {companySigneeTitle}</div>
                      <div>Date: ________________________</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">For Client</div>
                    <div className="border-b border-slate-900 h-10 w-full"></div>
                    <div className="text-[10px] text-slate-600 space-y-0.5">
                      <div>Authorized Signature</div>
                      <div>Name: {clientSignee || "________________________"}</div>
                      <div>Title: {clientSigneeTitle || "________________________"}</div>
                      <div>Date: ________________________</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
