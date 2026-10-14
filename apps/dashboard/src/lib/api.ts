import { createClient } from "./supabase/client";
import type {
  ConstituencyOverview,
  ComplaintStat,
  ComplaintCategoryBreakdown,
  ComplaintGeo,
  ProjectRecommendation,
  InfrastructureGap,
  UnderservedArea,
  ChatMessage,
} from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

// Mock Data (fallback when Supabase is offline / no data)
export const MOCK_OVERVIEW: ConstituencyOverview = {
  constituencyName: "Siyani, Gujarat",
  mpName: "Rajesh Vaghela",
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
  totalComplaintsThisMonth: 1248,
  totalComplaintsChange: 14.2,
  activeProjects: 34,
  activeProjectsChange: 8.5,
  budgetUtilised: 4.25,
  budgetUtilisedPercent: 85.0,
  topIssues: [
    { category: "Water Supply", count: 420, trend: "up" },
    { category: "Road Repairs", count: 350, trend: "up" },
    { category: "Healthcare Services", count: 210, trend: "stable" },
  ],
};

export const MOCK_TRENDS: ComplaintStat[] = [
  { date: "Jan", count: 180 },
  { date: "Feb", count: 220 },
  { date: "Mar", count: 290 },
  { date: "Apr", count: 340 },
  { date: "May", count: 410 },
  { date: "Jun", count: 480 },
  { date: "Jul", count: 1248 },
];

export const MOCK_CATEGORIES: ComplaintCategoryBreakdown[] = [
  { category: "Water Supply", count: 420, color: "#0143b5" },
  { category: "Road Repairs", count: 350, color: "#1877f2" },
  { category: "Healthcare Services", count: 210, color: "#e58600" },
  { category: "Education", count: 150, color: "#00a400" },
  { category: "Sanitation", count: 88, color: "#8a96a3" },
  { category: "Electricity", count: 30, color: "#ffd300" },
];

export const MOCK_GEO: { type: "FeatureCollection"; features: ComplaintGeo[] } = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "1", category: "Water", severity: "High",
        description: "Severe drinking water scarcity. Tube well dried up.",
        ward: "Ward 3", village: "Siyani", date: "2026-06-15",
      },
      geometry: { type: "Point", coordinates: [71.8512, 22.6521] },
    },
    {
      type: "Feature",
      properties: {
        id: "2", category: "Water", severity: "High",
        description: "Contaminated water supplying through pipeline, color is yellowish.",
        ward: "Ward 3", village: "Siyani", date: "2026-06-22",
      },
      geometry: { type: "Point", coordinates: [71.8542, 22.6565] },
    },
    {
      type: "Feature",
      properties: {
        id: "3", category: "Roads", severity: "High",
        description: "Main approach road fully damaged. Potholes causing accidents daily.",
        ward: "Ward 1", village: "Bhalgam", date: "2026-06-10",
      },
      geometry: { type: "Point", coordinates: [71.8210, 22.6390] },
    },
    {
      type: "Feature",
      properties: {
        id: "4", category: "Health", severity: "High",
        description: "No doctor present in PHC Subcenter for last 2 weeks.",
        ward: "Ward 1", village: "Bhalgam", date: "2026-06-18",
      },
      geometry: { type: "Point", coordinates: [71.8250, 22.6350] },
    },
    {
      type: "Feature",
      properties: {
        id: "5", category: "Roads", severity: "Medium",
        description: "Potholes on the bridge connecting to highway.",
        ward: "Ward 4", village: "Muli", date: "2026-06-29",
      },
      geometry: { type: "Point", coordinates: [71.9120, 22.6710] },
    },
    {
      type: "Feature",
      properties: {
        id: "6", category: "Education", severity: "Medium",
        description: "Lack of clean toilets and drinking water facility for girls in High School.",
        ward: "Ward 4", village: "Muli", date: "2026-06-25",
      },
      geometry: { type: "Point", coordinates: [71.9150, 22.6680] },
    },
    {
      type: "Feature",
      properties: {
        id: "7", category: "Sanitation", severity: "High",
        description: "Open sewage drain overflow near Siyani bus stand.",
        ward: "Ward 3", village: "Siyani", date: "2026-07-01",
      },
      geometry: { type: "Point", coordinates: [71.8490, 22.6505] },
    },
    {
      type: "Feature",
      properties: {
        id: "8", category: "Power", severity: "Low",
        description: "Frequent power cuts during night study hours.",
        ward: "Ward 2", village: "Ranpur", date: "2026-07-02",
      },
      geometry: { type: "Point", coordinates: [71.7910, 22.5830] },
    },
  ],
};

export const MOCK_PROJECTS: ProjectRecommendation[] = [
  {
    id: "proj_1",
    projectName: "Siyani Drinking Water Pipeline & RO Purification Plant",
    priorityScore: 94.5, category: "Water Supply",
    estimatedCost: "₹45,00,000", affectedPopulation: 8500,
    urgency: "Immediate", infrastructureDeficitScore: 9.2,
    explainableAI: "Critical water quality and availability deficit in Siyani...",
  },
  {
    id: "proj_2",
    projectName: "Bhalgam Primary Health Center (PHC) Upgrade & Solarization",
    priorityScore: 88.2, category: "Healthcare Services",
    estimatedCost: "₹28,00,000", affectedPopulation: 12000,
    urgency: "Immediate", infrastructureDeficitScore: 8.5,
    explainableAI: "The PHC subcenter in Bhalgam lacks round-the-clock power...",
  },
  {
    id: "proj_3",
    projectName: "Muli-Surendranagar Main Connecting Road Rehabilitation",
    priorityScore: 82.1, category: "Road Repairs",
    estimatedCost: "₹75,00,000", affectedPopulation: 15000,
    urgency: "Medium", infrastructureDeficitScore: 7.8,
    explainableAI: "This critical 4.2 km road...",
  },
  {
    id: "proj_4",
    projectName: "Govt High School Girls Toilet & Digital Classroom Setup",
    priorityScore: 74.0, category: "Education",
    estimatedCost: "₹18,00,000", affectedPopulation: 3400,
    urgency: "Immediate", infrastructureDeficitScore: 8.0,
    explainableAI: "Addressing a severe hygiene gap...",
  },
  {
    id: "proj_5",
    projectName: "Ranpur Community Sewage Drainage and Bio-Digester Installation",
    priorityScore: 68.4, category: "Sanitation",
    estimatedCost: "₹35,00,000", affectedPopulation: 5000,
    urgency: "Long-term", infrastructureDeficitScore: 6.9,
    explainableAI: "Open sewage channels in Ranpur...",
  },
];

export const MOCK_GAPS: InfrastructureGap[] = [
  { facilityType: "Drinking Water Stations", currentCount: 4, requiredCount: 10 },
  { facilityType: "Primary Health Subcenters", currentCount: 2, requiredCount: 4 },
  { facilityType: "High Schools / Skill Centers", currentCount: 2, requiredCount: 3 },
  { facilityType: "Paved Inter-Village Roads (kms)", currentCount: 45, requiredCount: 65 },
  { facilityType: "Sanitation & Waste Centers", currentCount: 3, requiredCount: 8 },
];

export const MOCK_UNDERSERVED: UnderservedArea[] = [
  { wardName: "Ward 3", villageName: "Siyani", deficitScore: 9.1, missingFacilities: ["Clean Drinking Water Stations", "Waste Collection Center"], severity: "Critical" },
  { wardName: "Ward 1", villageName: "Bhalgam", deficitScore: 8.4, missingFacilities: ["PHC Upgraded Center", "All-Weather Link Roads"], severity: "High" },
  { wardName: "Ward 4", villageName: "Muli", deficitScore: 7.2, missingFacilities: ["Girls Hygiene Facility", "Solid Waste Storage Hub"], severity: "High" },
  { wardName: "Ward 2", villageName: "Ranpur", deficitScore: 5.8, missingFacilities: ["Paved Village Street Channels"], severity: "Medium" },
];

// RAG Assistant Mock logic
export function getAssistantResponse(query: string): ChatMessage {
  const lowercaseQuery = query.toLowerCase();
  const msgId = `msg_${Date.now()}`;

  if (lowercaseQuery.includes("water") || lowercaseQuery.includes("siyani")) {
    return {
      id: msgId, sender: "assistant",
      text: "Based on our constituency database and current citizen feedback, water scarcity and quality in **Siyani village (Ward 3)** are the highest priority. There are 420 water-related complaints this month alone.",
      timestamp: new Date(),
      richData: { type: "chart", title: "Siyani Drinking Water Gaps", chartData: [{ name: "Current Stations", value: 4 }, { name: "Required Stations", value: 10 }] },
    };
  }

  if (lowercaseQuery.includes("road") || lowercaseQuery.includes("highway") || lowercaseQuery.includes("repair")) {
    return {
      id: msgId, sender: "assistant",
      text: "Under road repairs, the top issue is the **Muli-Surendranagar Main Connecting Road**. It is ranked #3 in priority due to heavy rainfall damage.",
      timestamp: new Date(),
      richData: { type: "table", title: "Road Projects Comparison", tableData: [{ Name: "Muli Connecting Road Rehab", Cost: "₹75L", Population: "15,000", Priority: "82.1" }] },
    };
  }

  if (lowercaseQuery.includes("priority") || lowercaseQuery.includes("rank") || lowercaseQuery.includes("why is")) {
    return {
      id: msgId, sender: "assistant",
      text: "Projects are ranked by our multi-criteria AI prioritisation engine. Here are the top 3 recommended projects with their scores:",
      timestamp: new Date(),
      richData: { type: "report", title: "AI Project Rankings Summary", tableData: MOCK_PROJECTS.slice(0, 3).map(p => ({ Rank: p.priorityScore > 90 ? "1" : p.priorityScore > 85 ? "2" : "3", Project: p.projectName, Score: p.priorityScore.toString(), Cost: p.estimatedCost })) },
    };
  }

  if (lowercaseQuery.includes("report") || lowercaseQuery.includes("generate")) {
    return {
      id: msgId, sender: "assistant",
      text: "I have compiled the **Monthly Constituency Development Report** for you.",
      timestamp: new Date(),
      richData: { type: "report", title: "Monthly Constituency Development Report", reportHtml: "<h3>Executive Summary</h3><p>For the month of July 2026, citizen complaints spiked by 14.2%...</p>" },
    };
  }

  return {
    id: msgId, sender: "assistant",
    text: "I can search across citizen complaints, current infrastructure gaps, and proposed projects. Try asking me about:\n- *'Show water issues in Siyani village'*\n- *'Road repair priorities'*\n- *'Why are projects ranked the way they are?'*\n- *'Generate a development report'*",
    timestamp: new Date(),
  };
}

// --- Supabase-backed functions with FastAPI + mock fallback ---

async function trySupabase<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return await fn();
  } catch (e) {
    console.warn("Supabase query failed, trying FastAPI backend.", e);
  }

  try {
    // No session or supabase failed - try FastAPI backend
    return await fn();
  } catch (e) {
    console.warn("All backends unavailable, using mock data.", e);
  }

  return fallback;
}

export async function fetchOverview(): Promise<ConstituencyOverview> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("constituency_id")
        .eq("id", user.id)
        .single();

      if (profile?.constituency_id) {
        const { getConstituencyOverview } = await import("./supabase/queries");
        const overview = await getConstituencyOverview(profile.constituency_id);
        if (overview) return overview;
      }
    }
  } catch { /* fall through */ }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/overview`, { headers });
    if (res.ok) {
      const data = await res.json();
      return {
        constituencyName: "",
        mpName: "",
        avatarUrl: "",
        totalComplaintsThisMonth: data.total_complaints ?? 0,
        totalComplaintsChange: data.trends?.percentage ?? 0,
        activeProjects: 0,
        activeProjectsChange: 0,
        budgetUtilised: 0,
        budgetUtilisedPercent: 0,
        topIssues: (data.top_categories ?? []).map((c: any) => ({
          category: c.category,
          count: c.count,
          trend: "stable" as const,
        })),
      };
    }
  } catch { /* fall through */ }

  return MOCK_OVERVIEW;
}

export async function fetchAnalytics(): Promise<{ trends: ComplaintStat[]; categories: ComplaintCategoryBreakdown[] }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("constituency_id")
        .eq("id", user.id)
        .single();

      if (profile?.constituency_id) {
        const { getComplaintTrends, getComplaintCategoryBreakdown } = await import("./supabase/queries");
        const [trends, categories] = await Promise.all([
          getComplaintTrends(profile.constituency_id),
          getComplaintCategoryBreakdown(profile.constituency_id),
        ]);
        if (trends.length > 0) return { trends, categories };
      }
    }
  } catch { /* fall through */ }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/analytics/insights`, { headers });
    if (res.ok) {
      const data = await res.json();
      const categories: ComplaintCategoryBreakdown[] = (data.top_categories ?? []).map(
        (c: any, i: number) => ({
          category: c.category,
          count: c.count,
          color: ["#0143b5", "#1877f2", "#e58600", "#00a400", "#8a96a3"][i] ?? "#ffd300",
        })
      );
      return { trends: MOCK_TRENDS, categories };
    }
  } catch { /* fall through */ }

  return { trends: MOCK_TRENDS, categories: MOCK_CATEGORIES };
}

export async function fetchGeoJSON(): Promise<{ type: "FeatureCollection"; features: ComplaintGeo[] }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("constituency_id")
        .eq("id", user.id)
        .single();

      if (profile?.constituency_id) {
        const { getComplaintsByConstituency } = await import("./supabase/queries");
        const complaints = await getComplaintsByConstituency(profile.constituency_id, { limit: 500 });

        const features: ComplaintGeo[] = complaints
          .filter((c) => c.location && typeof c.location === "object" && "coordinates" in (c.location as any))
          .map((c) => {
            const loc = c.location as any;
            return {
              type: "Feature",
              properties: {
                id: c.id,
                category: (c.category as any) ?? "Other",
                severity: c.urgency_score && c.urgency_score >= 7 ? "High" : c.urgency_score && c.urgency_score >= 4 ? "Medium" : "Low",
                description: c.original_text.slice(0, 200),
                ward: c.ward_id ?? "",
                village: c.location_name ?? "",
                date: c.created_at,
              },
              geometry: {
                type: "Point",
                coordinates: [loc.coordinates[0] as number, loc.coordinates[1] as number],
              },
            };
          });

        if (features.length > 0) return { type: "FeatureCollection", features };
      }
    }
  } catch { /* fall through */ }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/map`, { headers });
    if (res.ok) {
      const data = await res.json();
      const features: ComplaintGeo[] = (data ?? []).map((p: any) => ({
        type: "Feature",
        properties: {
          id: p.properties?.id ?? "",
          category: (p.properties?.category ?? "Other") as any,
          severity: (p.properties?.urgency_score ?? 5) >= 7 ? "High" as const : (p.properties?.urgency_score ?? 5) >= 4 ? "Medium" as const : "Low" as const,
          description: p.properties?.title ?? "",
          ward: p.properties?.ward ?? "",
          village: "",
          date: "",
        },
        geometry: {
          type: "Point",
          coordinates: (p.geometry?.coordinates ?? [0, 0]) as [number, number],
        },
      }));
      return { type: "FeatureCollection", features };
    }
  } catch { /* fall through */ }

  return MOCK_GEO;
}

export async function fetchProjects(): Promise<ProjectRecommendation[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("constituency_id")
        .eq("id", user.id)
        .single();

      if (profile?.constituency_id) {
        const { getProjectsByConstituency } = await import("./supabase/queries");
        const projects = await getProjectsByConstituency(profile.constituency_id);
        if (projects.length > 0) {
          return projects.map((p) => ({
            id: p.id,
            projectName: p.project_title,
            priorityScore: p.priority_score ?? 0,
            category: p.category ?? "General",
            estimatedCost: p.estimated_cost ? `₹${(p.estimated_cost / 100000).toFixed(1)}L` : "TBD",
            affectedPopulation: p.beneficiaries_estimate ?? 0,
            urgency: (p.priority_score ?? 0) >= 80 ? "Immediate" as const : (p.priority_score ?? 0) >= 60 ? "Medium" as const : "Long-term" as const,
            infrastructureDeficitScore: ((p.priority_score ?? 0) / 10),
            explainableAI: p.explanation ?? "",
          }));
        }
      }
    }
  } catch { /* fall through */ }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/projects`, { headers });
    if (res.ok) {
      const data = await res.json();
      const items: any[] = data.items ?? data ?? [];
      return items.map((p: any) => ({
        id: p.id,
        projectName: p.title ?? p.projectName ?? "",
        priorityScore: p.priority_score ?? p.priorityScore ?? 0,
        category: p.category ?? "General",
        estimatedCost: p.estimated_cost ? `₹${(p.estimated_cost / 100000).toFixed(1)}L` : "TBD",
        affectedPopulation: 0,
        urgency: ((p.priority_score ?? 0) >= 80 ? "Immediate" : (p.priority_score ?? 0) >= 60 ? "Medium" : "Long-term") as any,
        infrastructureDeficitScore: ((p.priority_score ?? 0) / 10),
        explainableAI: p.reasoning ?? "",
      }));
    }
  } catch { /* fall through */ }

  return MOCK_PROJECTS;
}

export async function fetchGaps(): Promise<{ gaps: InfrastructureGap[]; underserved: UnderservedArea[] }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("constituency_id")
        .eq("id", user.id)
        .single();

      if (profile?.constituency_id) {
        const { getInfrastructureGaps } = await import("./supabase/queries");
        const gaps = await getInfrastructureGaps(profile.constituency_id);
        if (gaps.length > 0) {
          return {
            gaps,
            underserved: gaps
              .filter((g) => g.requiredCount > g.currentCount)
              .map((g, i) => ({
                wardName: `Ward ${i + 1}`,
                villageName: "Area",
                deficitScore: Math.min(10, ((g.requiredCount - g.currentCount) / g.requiredCount) * 10),
                missingFacilities: [g.facilityType],
                severity: ((g.requiredCount - g.currentCount) / g.requiredCount) > 0.5 ? "Critical" as const : "High" as const,
              })),
          };
        }
      }
    }
  } catch { /* fall through */ }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/analytics/insights`, { headers });
    if (res.ok) {
      const data = await res.json();
      return { gaps: MOCK_GAPS, underserved: MOCK_UNDERSERVED };
    }
  } catch { /* fall through */ }

  return { gaps: MOCK_GAPS, underserved: MOCK_UNDERSERVED };
}

export async function submitAssistantQuery(question: string): Promise<ChatMessage> {
  const supabase = createClient();

  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/assistant/chat`, {
      method: "POST",
      headers: { ...authHeaders },
      body: JSON.stringify({ question }),
    });
    if (res.ok) {
      const msg: ChatMessage = await res.json();
      await saveChatToDb(question, msg.text);
      return msg;
    }
  } catch { /* fall through */ }

  await new Promise((resolve) => setTimeout(resolve, 800));
  const mockResponse = getAssistantResponse(question);
  await saveChatToDb(question, mockResponse.text);
  return mockResponse;
}

async function saveChatToDb(question: string, answer: string) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("constituency_id")
        .eq("id", user.id)
        .single();

      await supabase.from("assistant_chats").insert({
        user_id: user.id,
        constituency_id: profile?.constituency_id,
        question,
        answer,
      });
    }
  } catch { /* silently fail - chat still works */ }
}
