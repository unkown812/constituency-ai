import { createClient } from "./client";
import type { ConstituencyOverview, ComplaintCategoryBreakdown, ComplaintStat } from "../../types";

function client() {
  return createClient();
}

// --- Profiles ---

export async function getProfile(userId: string) {
  const supabase = client();
  const { data } = await supabase
    .from("profiles")
    .select("*, constituencies(name, state)")
    .eq("id", userId)
    .single();
  return data as any;
}

export async function updateProfile(userId: string, updates: Record<string, any>) {
  const supabase = client();
  const { data } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  return data as any;
}

// --- Constituencies ---

export async function getConstituency(id: string) {
  const supabase = client();
  const { data } = await supabase
    .from("constituencies")
    .select("*, profiles!constituencies_mp_profile_id_fkey(full_name, avatar_url)")
    .eq("id", id)
    .single();
  return data as any;
}

export async function getConstituencyByMp(mpProfileId: string) {
  const supabase = client();
  const { data } = await supabase
    .from("constituencies")
    .select("*")
    .eq("mp_profile_id", mpProfileId)
    .single();
  return data as any;
}

export async function getWards(constituencyId: string) {
  const supabase = client();
  const { data } = await supabase
    .from("wards")
    .select("*")
    .eq("constituency_id", constituencyId)
    .order("name");
  return (data ?? []) as any[];
}

// --- Complaints ---

export async function getComplaintsByConstituency(
  constituencyId: string,
  options?: { status?: string; wardId?: string; limit?: number; offset?: number }
) {
  const supabase = client();
  let query = supabase
    .from("complaints")
    .select("*, wards!left(name)")
    .eq("constituency_id", constituencyId)
    .order("created_at", { ascending: false });

  if (options?.status) query = query.eq("status", options.status);
  if (options?.wardId) query = query.eq("ward_id", options.wardId);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset !== undefined) {
    const lim = options?.limit ?? 10;
    query = query.range(options.offset, options.offset + lim - 1);
  }

  const { data } = await query;
  return (data ?? []) as any[];
}

export async function getComplaintsByUser(userId: string, options?: { status?: string; limit?: number; offset?: number }) {
  const supabase = client();
  let query = supabase
    .from("complaints")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") query = query.eq("status", options.status);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset !== undefined) {
    const lim = options?.limit ?? 20;
    query = query.range(options.offset, options.offset + lim - 1);
  }

  const { data } = await query;
  return (data ?? []) as any[];
}

export async function getComplaintById(id: string) {
  const supabase = client();
  const { data } = await supabase.from("complaints").select("*").eq("id", id).single();
  return data as any;
}

export async function createComplaint(complaint: Record<string, any>) {
  const supabase = client();
  const { data } = await supabase.from("complaints").insert(complaint).select().single();
  return data as any;
}

export async function getComplaintStats(constituencyId: string) {
  const supabase = client();
  const [totalRes, monthlyRes, statusRes, categoriesRes] = await Promise.all([
    supabase.from("complaints").select("*", { count: "exact", head: true }).eq("constituency_id", constituencyId),
    supabase.from("complaints").select("*", { count: "exact", head: true }).eq("constituency_id", constituencyId).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    supabase.from("complaints").select("status").eq("constituency_id", constituencyId),
    supabase.from("complaints").select("category").eq("constituency_id", constituencyId),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of statusRes.data ?? []) {
    const s = (row as any).status;
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }

  const byCategory: Record<string, number> = {};
  for (const row of categoriesRes.data ?? []) {
    const c = (row as any).category;
    if (c) byCategory[c] = (byCategory[c] ?? 0) + 1;
  }

  return {
    total: totalRes.count ?? 0,
    thisMonth: monthlyRes.count ?? 0,
    byStatus,
    byCategory,
  };
}

export async function getComplaintTrends(constituencyId: string, months = 6): Promise<ComplaintStat[]> {
  const supabase = client();
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data } = await supabase
    .from("complaints")
    .select("created_at")
    .eq("constituency_id", constituencyId)
    .gte("created_at", since.toISOString())
    .order("created_at");

  const monthCounts: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = new Date((row as any).created_at).toLocaleString("en-US", { month: "short" });
    monthCounts[key] = (monthCounts[key] ?? 0) + 1;
  }

  return Object.entries(monthCounts).map(([date, count]) => ({ date, count }));
}

export async function getComplaintCategoryBreakdown(constituencyId: string): Promise<ComplaintCategoryBreakdown[]> {
  const supabase = client();
  const { data } = await supabase
    .from("complaints")
    .select("category")
    .eq("constituency_id", constituencyId);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const c = (row as any).category;
    if (c) counts[c] = (counts[c] ?? 0) + 1;
  }

  const palette = ["#0143b5", "#1877f2", "#e58600", "#00a400", "#8a96a3", "#ffd300"];
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count], i) => ({
      category,
      count,
      color: palette[i % palette.length],
    }));
}

// --- Projects ---

export async function getProjectsByConstituency(constituencyId: string) {
  const supabase = client();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("constituency_id", constituencyId)
    .order("priority_score", { ascending: false, nullsFirst: false });
  return (data ?? []) as any[];
}

export async function updateProjectStatus(id: string, status: string, approvedBy?: string) {
  const supabase = client();
  const updates: Record<string, any> = { status };
  if (status === "approved" && approvedBy) {
    updates.approved_by = approvedBy;
    updates.approved_at = new Date().toISOString();
  }
  const { data } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return data as any;
}

// --- Infrastructure ---

export async function getInfrastructureGaps(constituencyId: string) {
  const supabase = client();
  const { data } = await supabase
    .from("infrastructure")
    .select("type, ward_id")
    .eq("constituency_id", constituencyId);

  const types = ["school", "hospital", "water_supply", "road", "public_transport", "electricity"];
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const t = (row as any).type;
    counts[t] = (counts[t] ?? 0) + 1;
  }

  const requirements: Record<string, number> = {
    school: 3, hospital: 4, water_supply: 10, road: 65, public_transport: 5, electricity: 8,
  };

  return types.map((type) => ({
    facilityType: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    currentCount: counts[type] ?? 0,
    requiredCount: requirements[type] ?? 5,
  }));
}

// --- Demographics ---

export async function getDemographics(constituencyId: string) {
  const supabase = client();
  const { data } = await supabase
    .from("demographics")
    .select("*, wards!inner(name, constituency_id)")
    .eq("wards.constituency_id", constituencyId);
  return (data ?? []) as any[];
}

// --- Assistant Chats ---

export async function saveChatMessage(chat: Record<string, any>) {
  const supabase = client();
  const { data } = await supabase.from("assistant_chats").insert(chat).select().single();
  return data as any;
}

export async function getChatHistory(userId: string, limit = 50) {
  const supabase = client();
  const { data } = await supabase
    .from("assistant_chats")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as any[];
}

// --- Reports ---

export async function createReport(report: Record<string, any>) {
  const supabase = client();
  const { data } = await supabase.from("reports").insert(report).select().single();
  return data as any;
}

export async function getReportsByConstituency(constituencyId: string) {
  const supabase = client();
  const { data } = await supabase
    .from("reports")
    .select("*, profiles!reports_created_by_fkey(full_name)")
    .eq("constituency_id", constituencyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as any[];
}

// --- Recommendation Feedback ---

export async function saveFeedback(feedback: Record<string, any>) {
  const supabase = client();
  const { data } = await supabase.from("recommendation_feedback").insert(feedback).select().single();
  return data as any;
}

export async function getFeedbackForProject(projectId: string) {
  const supabase = client();
  const { data } = await supabase
    .from("recommendation_feedback")
    .select("*, profiles!recommendation_feedback_mp_user_id_fkey(full_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data ?? []) as any[];
}

// --- Overview ---

export async function getConstituencyOverview(constituencyId: string): Promise<ConstituencyOverview | null> {
  const supabase = client();

  const [constituencyResult, stats, projectsResult] = await Promise.all([
    supabase.from("constituencies").select("*, profiles!constituencies_mp_profile_id_fkey(full_name, avatar_url)").eq("id", constituencyId).single(),
    getComplaintStats(constituencyId),
    supabase.from("projects").select("*").eq("constituency_id", constituencyId),
  ]);

  const constituency = constituencyResult.data as any;
  if (!constituency) return null;

  const projects = (projectsResult.data ?? []) as any[];
  const activeProjects = projects.filter((p: any) => p.status === "approved" || p.status === "in_progress");

  const categoryBreakdown = await getComplaintCategoryBreakdown(constituencyId);
  const topIssues = categoryBreakdown.slice(0, 3).map((c) => ({
    category: c.category,
    count: c.count,
    trend: c.count > 200 ? "up" as const : c.count > 100 ? "stable" as const : "down" as const,
  }));

  return {
    constituencyName: constituency.name,
    mpName: constituency.profiles?.full_name ?? "MP",
    avatarUrl: constituency.profiles?.avatar_url ?? "",
    totalComplaintsThisMonth: stats.thisMonth,
    totalComplaintsChange: stats.total > 0 ? Math.round((stats.thisMonth / (stats.total - stats.thisMonth || 1)) * 100) : 0,
    activeProjects: activeProjects.length,
    activeProjectsChange: 0,
    budgetUtilised: 0,
    budgetUtilisedPercent: 0,
    topIssues,
  };
}
