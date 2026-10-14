import { useQuery, useMutation, useQueryClient, infiniteQueryOptions } from '@tanstack/react-query';
import api from '@/src/lib/api';
import {
  Submission,
  SubmissionListResponse,
  SubmissionStats,
  SubmissionStatus,
  CreateSubmissionPayload,
} from '@/src/types';
import { CONFIG } from '@/src/constants/config';

export function useSubmissionStats() {
  return useQuery<SubmissionStats>({
    queryKey: ['submissions', 'stats'],
    queryFn: async () => {
      const response = await api.get<SubmissionStats>('/submissions/stats');
      return response.data;
    },
  });
}

export function useSubmissions(status?: string) {
  return useQuery<SubmissionListResponse>({
    queryKey: ['submissions', 'list', status],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: 1,
        limit: CONFIG.PAGINATION_LIMIT,
        sort: 'recent',
      };
      if (status && status !== 'all') {
        params.status = status;
      }
      const response = await api.get<SubmissionListResponse>('/submissions', { params });
      return response.data;
    },
  });
}

export function useSubmissionDetail(id: string) {
  return useQuery<Submission>({
    queryKey: ['submissions', id],
    queryFn: async () => {
      const response = await api.get<Submission>(`/submissions/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSubmissionPayload) => {
      const response = await api.post<Submission>('/submissions', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async ({
      id,
      rating,
      comment,
    }: {
      id: string;
      rating: 'thumbs_up' | 'thumbs_down';
      comment?: string;
    }) => {
      const response = await api.put(`/submissions/${id}/feedback`, { rating, comment });
      return response.data;
    },
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({
      fileUri,
      fileType,
    }: {
      fileUri: string;
      fileType: 'image' | 'document' | 'voice';
    }) => {
      const formData = new FormData();
      const filename = fileUri.split('/').pop() ?? 'file';
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: mimeMap[ext] ?? 'application/octet-stream',
      } as unknown as Blob);
      formData.append('type', fileType);

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as { url: string; thumbnail_url?: string };
    },
  });
}

export function useTranscribeVoice() {
  return useMutation({
    mutationFn: async ({ fileUri, language }: { fileUri: string; language?: string }) => {
      const formData = new FormData();
      const filename = fileUri.split('/').pop() ?? 'audio.mp3';
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: 'audio/mpeg',
      } as unknown as Blob);
      if (language) {
        formData.append('language', language);
      }
      const response = await api.post('/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as {
        url: string;
        transcript: string;
        transcript_en: string;
        detected_language: string;
      };
    },
  });
}
