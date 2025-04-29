-- Disable RLS temporarily to fix the data
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions DISABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is an admin (teacher)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is accessing their own data
CREATE OR REPLACE FUNCTION public.is_self(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can do anything with users" ON public.users;

DROP POLICY IF EXISTS "Users can view their own balance" ON public.balances;
DROP POLICY IF EXISTS "Admins can view all balances" ON public.balances;
DROP POLICY IF EXISTS "Admins can update balances" ON public.balances;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can create transactions" ON public.transactions;

-- Create new policies for users table
CREATE POLICY "Users can view their own data" 
ON public.users FOR SELECT 
USING (is_self(id));

CREATE POLICY "Users can update their own data" 
ON public.users FOR UPDATE 
USING (is_self(id));

CREATE POLICY "Admins can do anything with users" 
ON public.users
USING (is_admin());

-- Create policies for balances table
CREATE POLICY "Users can view their own balance" 
ON public.balances FOR SELECT 
USING (is_self(user_id));

CREATE POLICY "Admins can view all balances" 
ON public.balances FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update balances" 
ON public.balances FOR UPDATE 
USING (is_admin());

-- Create policies for transactions table
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (is_self(user_id));

CREATE POLICY "Admins can view all transactions" 
ON public.transactions FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can create transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (is_admin());

-- Create policies for rewards table
CREATE POLICY "Anyone can view active rewards" 
ON public.rewards FOR SELECT 
USING (active = true OR is_admin());

CREATE POLICY "Admins can manage rewards" 
ON public.rewards
USING (is_admin());

-- Create policies for reward_redemptions table
CREATE POLICY "Users can view their own redemptions" 
ON public.reward_redemptions FOR SELECT 
USING (is_self(user_id));

CREATE POLICY "Users can create redemptions" 
ON public.reward_redemptions FOR INSERT 
WITH CHECK (is_self(user_id));

CREATE POLICY "Admins can view all redemptions" 
ON public.reward_redemptions FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update redemptions" 
ON public.reward_redemptions FOR UPDATE 
USING (is_admin());
