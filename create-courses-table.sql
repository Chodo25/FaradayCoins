-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_name ON public.courses(name);

-- Add course_id column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id);

-- Create policy for courses
DROP POLICY IF EXISTS "Teachers can manage courses" ON public.courses;
CREATE POLICY "Teachers can manage courses" 
ON public.courses
FOR ALL
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role IN ('teacher', 'admin')
));

-- Create policy for public access to courses
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
CREATE POLICY "Anyone can view courses" 
ON public.courses
FOR SELECT
USING (true);

-- Enable RLS on courses table
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin or teacher
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'teacher')
    FROM public.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update users table policies to include course_id
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
USING (
  auth.uid() = id OR 
  auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('teacher', 'admin')
  )
);

DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users"
ON public.users
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('teacher', 'admin')
  )
);

-- Create helper function to get course name
CREATE OR REPLACE FUNCTION public.get_course_name(course_id UUID)
RETURNS VARCHAR AS $$
BEGIN
  RETURN (
    SELECT name
    FROM public.courses
    WHERE id = course_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
