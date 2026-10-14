"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../lib/supabase/client";
import type {
  Submission,
  SubmissionSummary,
  SubmissionListResponse,
  SubmissionStats,
  Profile,
  CreateSubmissionPayload,
  UpdateProfilePayload,
  SubmissionStatus,
} from "../types/citizen";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_SUBMISSIONS: Submission[] = Array.from({ length: 25 }, (_, i) => ({
  id: `sub_${i + 1}`,
  title: [
    "Road potholes near main market",
    "Water supply disruption in Ward 3",
    "Primary health center needs doctor",
    "School toilet renovation required",
    "Street light not working on Main Road",
    "Drainage overflow near bus stand",
    "Anganwadi center needs repairs",
    "Handpump broken in colony",
  ][i % 8] + ` #${i + 1}`,
  description: "Detailed description of the issue with additional context about the location and severity.",
  category: ["Roads", "Water Supply", "Healthcare", "Education", "Electricity", "Sanitation", "Other", "Water Supply"][i % 8],
  status: (["new", "ai_processing", "analyzed", "under_review", "resolved", "closed"] as SubmissionStatus[])[i % 6],
  location: { latitude: 22.6521 + i * 0.01, longitude: 71.8512 + i * 0.01, name: "Siyani, Gujarat" },
  address: "Main Road, Siyani, Gujarat",
  ward: `Ward ${(i % 4) + 1}`,
  image_urls: i % 3 === 0 ? [] : ["https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400"],
  thumbnail_url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200",
  image_count: i % 3 === 0 ? 0 : 1,
  ai_summary: i % 2 === 0 ? "AI analysis suggests this issue requires immediate attention." : undefined,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
  updated_at: new Date(Date.now() - i * 43200000).toISOString(),
  timeline: [
    { event: "submitted", label: "Submitted", date: new Date(Date.now() - i * 86400000).toISOString(), icon: "Send" },
    { event: "ai_processing", label: "AI Analysis", date: new Date(Date.now() - i * 80000000).toISOString(), icon: "Sparkles" },
    { event: "under_review", label: "Under Review", date: new Date(Date.now() - i * 50000000).toISOString(), icon: "Eye" },
  ],
}));

const MOCK_PROFILE: Profile = {
  id: "citizen_1",
  full_name: "Ramesh Patel",
  phone: "+91 98765 43210",
  constituency_id: "const_1",
  constituency_name: "Siyani, Gujarat",
  preferred_language: "en",
  notification_enabled: true,
  created_at: new Date().toISOString(),
};

function mapComplaintToSubmission(c: any): Submission {
  const loc = c.location ?? {};
  const coords = loc?.coordinates as number[] | undefined;
  return {
    id: c.id,
    title: c.title ?? c.original_text?.slice(0, 60) ?? "",
    description: c.original_text ?? "",
    original_description: c.original_text,
    original_language: c.original_language,
    category: c.category ?? "Other",
    status: c.status as SubmissionStatus,
    location: {
      latitude: coords?.[1] ?? 22.65,
      longitude: coords?.[0] ?? 71.85,
      name: c.location_name ?? undefined,
    },
    address: c.location_name ?? undefined,
    ward: c.ward_id ?? undefined,
    image_urls: c.image_paths ?? [],
    image_count: (c.image_paths ?? []).length,
    voice_url: c.voice_path ?? undefined,
    voice_transcript: c.translated_text ?? undefined,
    ai_summary: c.summary ?? undefined,
    ai_confidence: c.ai_confidence ?? undefined,
    created_at: c.created_at,
    updated_at: c.updated_at,
    timeline: [
      {
        event: c.status,
        label: c.status?.replace(/_/g, " ").replace(/\b\w/g, (s: string) => s.toUpperCase()) ?? "",
        date: c.created_at,
        icon: "Send",
      },
    ],
  };
}

function mapComplaintToSummary(c: any): SubmissionSummary {
  const loc = c.location ?? {};
  const coords = loc?.coordinates as number[] | undefined;
  return {
    id: c.id,
    title: c.title ?? c.original_text?.slice(0, 60) ?? "",
    category: c.category ?? "Other",
    status: c.status as SubmissionStatus,
    location: {
      latitude: coords?.[1] ?? 22.65,
      longitude: coords?.[0] ?? 71.85,
      name: c.location_name ?? undefined,
    },
    thumbnail_url: c.image_paths?.[0] ?? undefined,
    image_count: (c.image_paths ?? []).length,
    created_at: c.created_at,
    updated_at: c.updated_at,
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useSubmissions(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["citizen", "submissions", status, page, limit],
    queryFn: async (): Promise<SubmissionListResponse> => {
      const userId = await getCurrentUserId();

      if (userId) {
        const supabase = createClient();
        let query = supabase
          .from("complaints")
          .select("*", { count: "exact" })
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (status && status !== "all") {
          query = query.eq("status", status);
        }

        const from = (page - 1) * limit;
        query = query.range(from, from + limit - 1);

        const { data, count, error } = await query;
        if (!error && data && data.length > 0) {
          return {
            items: data.map(mapComplaintToSummary),
            total: count ?? data.length,
            page,
            limit,
            total_pages: Math.ceil((count ?? data.length) / limit),
          };
        }
      }

      // Fallback to mock
      await delay(400);
      let items = MOCK_SUBMISSIONS.map(
        ({ id, title, category, status: s, location, thumbnail_url, image_count, created_at, updated_at }) => ({
          id, title, category, status: s, location, thumbnail_url, image_count: image_count ?? 0, created_at, updated_at,
        })
      );
      if (status && status !== "all") {
        items = items.filter((i) => i.status === status);
      }
      const start = (page - 1) * limit;
      const paged = items.slice(start, start + limit);
      return { items: paged, total: items.length, page, limit, total_pages: Math.ceil(items.length / limit) };
    },
  });
}

export function useSubmissionDetail(id: string) {
  return useQuery({
    queryKey: ["citizen", "submission", id],
    queryFn: async (): Promise<Submission> => {
      const supabase = createClient();
      const { data, error } = await supabase.from("complaints").select("*").eq("id", id).single();
      if (!error && data) return mapComplaintToSubmission(data);

      await delay(300);
      const sub = MOCK_SUBMISSIONS.find((s) => s.id === id);
      if (!sub) throw new Error("Submission not found");
      return sub;
    },
    enabled: !!id,
  });
}

export function useSubmissionStats() {
  return useQuery({
    queryKey: ["citizen", "submissions", "stats"],
    queryFn: async (): Promise<SubmissionStats> => {
      const userId = await getCurrentUserId();

      if (userId) {
        const supabase = createClient();
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

        const { count: total } = await supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        const { count: thisMonth } = await supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", monthAgo);

        const { data: statusData } = await supabase
          .from("complaints")
          .select("status")
          .eq("user_id", userId);

        const byStatus: Record<string, number> = {};
        for (const row of statusData ?? []) {
          const s = (row as any).status;
          byStatus[s] = (byStatus[s] ?? 0) + 1;
        }

        return {
          total: total ?? 0,
          this_month: thisMonth ?? 0,
          by_status: byStatus as any,
          resolved_this_month: byStatus["resolved"] ?? 0,
          under_review: byStatus["under_review"] ?? 0,
        };
      }

      // Fallback
      await delay(300);
      const by_status = {} as Record<string, number>;
      MOCK_SUBMISSIONS.forEach((s) => {
        by_status[s.status] = (by_status[s.status] || 0) + 1;
      });
      return {
        total: MOCK_SUBMISSIONS.length,
        this_month: 12,
        by_status: by_status as any,
        resolved_this_month: 3,
        under_review: 5,
      };
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["citizen", "profile"],
    queryFn: async (): Promise<Profile> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: dataRow } = await supabase
          .from("profiles")
          .select("*, constituencies!inner(name)")
          .eq("id", user.id)
          .single();

        const profileRow = dataRow as any;
        if (profileRow) {
          return {
            id: profileRow.id,
            full_name: profileRow.full_name ?? "",
            phone: profileRow.phone ?? user.phone ?? "",
            email: user.email ?? undefined,
            avatar_url: profileRow.avatar_url ?? undefined,
            constituency_id: profileRow.constituency_id ?? "",
            constituency_name: profileRow.constituencies?.name ?? "",
            preferred_language: "en",
            notification_enabled: true,
            created_at: profileRow.created_at,
          };
        }
      }

      await delay(200);
      return { ...MOCK_PROFILE };
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload): Promise<Profile> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const updates: Record<string, any> = {};
        if (payload.full_name) updates.full_name = payload.full_name;
        if (payload.preferred_language) {
          await supabase.auth.updateUser({ data: { preferred_language: payload.preferred_language } });
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from("profiles").update(updates).eq("id", user.id);
        }

        const { data: dataRow } = await supabase
          .from("profiles")
          .select("*, constituencies!inner(name)")
          .eq("id", user.id)
          .single();
        const profileRow = dataRow as any;

        return {
          id: user.id,
          full_name: (profileRow?.full_name ?? payload.full_name) ?? "",
          phone: profileRow?.phone ?? user.phone ?? "",
          email: user.email ?? undefined,
          avatar_url: profileRow?.avatar_url ?? undefined,
          constituency_id: profileRow?.constituency_id ?? "",
          constituency_name: profileRow?.constituencies?.name ?? "",
          preferred_language: payload.preferred_language ?? "en",
          notification_enabled: payload.notification_enabled ?? true,
          created_at: profileRow?.created_at ?? new Date().toISOString(),
        };
      }

      // Fallback
      await delay(500);
      Object.assign(MOCK_PROFILE, payload);
      return { ...MOCK_PROFILE };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen", "profile"] });
    },
  });
}

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSubmissionPayload): Promise<Submission> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("constituency_id")
          .eq("id", user.id)
          .single();
        const profile = profileRow as any;

        const { data: complaint } = await supabase
          .from("complaints")
          .insert({
            user_id: user.id,
            constituency_id: profile?.constituency_id ?? "00000000-0000-0000-0000-000000000000",
            original_text: payload.description,
            category: payload.category,
            location: {
              type: "Point",
              coordinates: [payload.longitude ?? 71.85, payload.latitude ?? 22.65],
            },
            location_name: payload.address ?? null,
            image_paths: payload.image_urls ?? [],
            status: "new",
          })
          .select()
          .single();

        if (complaint) return mapComplaintToSubmission(complaint);
      }

      // Fallback
      await delay(1000);
      return {
        id: `sub_new_${Date.now()}`,
        title: payload.description.slice(0, 60),
        description: payload.description,
        category: payload.category,
        status: "new",
        location: { latitude: payload.latitude || 22.65, longitude: payload.longitude || 71.85, name: payload.address },
        address: payload.address,
        image_urls: payload.image_urls || [],
        image_count: (payload.image_urls || []).length,
        voice_url: payload.voice_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        timeline: [{ event: "submitted", label: "Submitted", date: new Date().toISOString(), icon: "Send" }],
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen", "submissions"] });
      qc.invalidateQueries({ queryKey: ["citizen", "submissions", "stats"] });
    },
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      await delay(300);
      return { success: true };
    },
  });
}
