import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Platform {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  is_active: boolean;
}

const mockPlatforms: Platform[] = [
  { id: '1', user_id: 'demo', name: 'Uber Moto', color: '#000000', icon: 'bike', is_active: true },
  { id: '2', user_id: 'demo', name: '99', color: '#FFD700', icon: 'car', is_active: true },
  { id: '3', user_id: 'demo', name: 'iFood', color: '#EA1D2C', icon: 'shopping-bag', is_active: true },
];

export function usePlatforms() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['platforms', user?.id],
    queryFn: async () => {
      if (isDemo) return mockPlatforms;
      const { data, error } = await supabase.from('platforms').select('*').eq('user_id', user?.id).order('name');
      if (error) throw error;
      return data as Platform[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (platform: Omit<Platform, 'id' | 'user_id'>) => {
      if (isDemo) return platform as Platform;
      const { data, error } = await supabase.from('platforms').insert([{ ...platform, user_id: user?.id }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Platform> & { id: string }) => {
      if (isDemo) return;
      const { error } = await supabase.from('platforms').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('platforms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
  });

  return { 
    ...query, 
    addPlatform: addMutation.mutateAsync, 
    updatePlatform: updateMutation.mutateAsync,
    deletePlatform: deleteMutation.mutateAsync
  };
}
