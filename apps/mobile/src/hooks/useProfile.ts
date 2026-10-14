import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/lib/api';
import { Profile, UpdateProfilePayload } from '@/src/types';
import { useAuth } from '@/src/stores/auth-store';

export function useProfile() {
  const { setUser } = useAuth();

  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get<Profile>('/profile');
      return response.data;
    },
    meta: {
      onSuccess: (data: Profile) => {
        setUser(data);
      },
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const response = await api.put<Profile>('/profile', payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      setUser(data);
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileUri: string) => {
      const formData = new FormData();
      const filename = fileUri.split('/').pop() ?? 'avatar.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as unknown as Blob);
      const response = await api.post<{ avatar_url: string }>('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
