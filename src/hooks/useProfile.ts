import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Profile {
  id: string;
  name: string;
  created_at: string;
}

export function useProfile() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (isDemo) return { id: user?.id, name: user?.user_metadata?.name || 'Demo User', created_at: new Date().toISOString() };
      
      // Try to get from profiles table
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) return data as Profile;
      
      // Fallback to auth metadata if profile row doesn't exist yet
      return { id: user?.id, name: user?.user_metadata?.name || '', created_at: new Date().toISOString() } as Profile;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (name: string) => {
      if (isDemo) {
        alert("Modo Demo: Nome atualizado localmente (falso).");
        return { id: user?.id, name, created_at: new Date().toISOString() } as Profile;
      }
      
      // Update auth user metadata
      const { error: authErr } = await supabase.auth.updateUser({ data: { name } });
      if (authErr) throw authErr;

      // Update profiles table
      const { data, error } = await supabase.from('profiles').upsert({ id: user?.id, name }).select().single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  return { ...query, updateProfile: updateMutation.mutateAsync };
}
