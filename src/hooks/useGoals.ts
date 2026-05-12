import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface MonthlyGoal {
  id: string;
  user_id: string;
  month: number;
  year: number;
  earning_goal: number;
  expense_limit: number;
}

export function useGoals(month: number, year: number) {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['goals', user?.id, month, year],
    queryFn: async () => {
      if (isDemo) return { earning_goal: 3000, expense_limit: 1500 } as MonthlyGoal;
      const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('month', month)
        .eq('year', year)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data as MonthlyGoal | null;
    },
    enabled: !!user,
  });

  const upsertMutation = useMutation({
    mutationFn: async (goal: Omit<MonthlyGoal, 'id' | 'user_id'>) => {
      if (isDemo) return goal as MonthlyGoal;
      const { data, error } = await supabase.from('monthly_goals').upsert({
        ...goal,
        user_id: user?.id,
      }, { onConflict: 'user_id,month,year' }).select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      // Invalidate specific cache properly if needed
    },
  });

  return { ...query, upsertGoal: upsertMutation.mutateAsync };
}
