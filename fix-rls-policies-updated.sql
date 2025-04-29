-- 1. Deshabilitar RLS temporalmente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions DISABLE ROW LEVEL SECURITY;

-- 2. Crear funciones necesarias

-- Función para saber si es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para saber si es dueño de los datos
CREATE OR REPLACE FUNCTION public.is_self(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Borrar todas las policies existentes

DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Borrar policies de users
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
  END LOOP;

  -- Borrar policies de balances
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'balances' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.balances', pol.policyname);
  END LOOP;

  -- Borrar policies de transactions
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'transactions' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.transactions', pol.policyname);
  END LOOP;

  -- Borrar policies de rewards
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'rewards' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.rewards', pol.policyname);
  END LOOP;

  -- Borrar policies de reward_redemptions
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'reward_redemptions' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reward_redemptions', pol.policyname);
  END LOOP;
END $$;

-- 4. Rehabilitar RLS

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- 5. Crear nuevas policies

-- --- USERS ---
CREATE POLICY "Users can view their own data" 
ON public.users FOR SELECT 
USING (is_self(id));

CREATE POLICY "Users can update their own data" 
ON public.users FOR UPDATE 
USING (is_self(id));

CREATE POLICY "Admins can do anything with users" 
ON public.users
USING (is_admin());

-- --- BALANCES ---
CREATE POLICY "Users can view their own balance" 
ON public.balances FOR SELECT 
USING (is_self(user_id));

CREATE POLICY "Admins can view all balances" 
ON public.balances FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update balances" 
ON public.balances FOR UPDATE 
USING (is_admin());

-- --- TRANSACTIONS ---
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (is_self(user_id));

CREATE POLICY "Admins can view all transactions" 
ON public.transactions FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can create transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (is_admin());

-- --- REWARDS ---
CREATE POLICY "Anyone can view active rewards" 
ON public.rewards FOR SELECT 
USING (active = true OR is_admin());

CREATE POLICY "Admins can manage rewards" 
ON public.rewards
USING (is_admin());

-- --- REWARD REDEMPTIONS ---
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
