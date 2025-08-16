-- Fix the connections table RLS policies (drop first then recreate)
DROP POLICY IF EXISTS "Users can view their own connections" ON public.connections;
DROP POLICY IF EXISTS "Users can create their own connections" ON public.connections;

-- RLS policies for connections
CREATE POLICY "Users can view their own connections" ON public.connections
  FOR SELECT USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "Users can create their own connections" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);