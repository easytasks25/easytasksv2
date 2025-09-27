-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'team' CHECK (type IN ('company', 'team')),
  domain TEXT,
  settings JSONB,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_organizations table
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, organization_id)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#006325',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_users table
CREATE TABLE IF NOT EXISTS project_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Create buckets table
CREATE TABLE IF NOT EXISTS buckets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  color TEXT DEFAULT '#e5efe9',
  order_index INTEGER DEFAULT 0,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'med' CHECK (priority IN ('low', 'med', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'done')),
  due_date TIMESTAMP WITH TIME ZONE,
  category TEXT,
  notes TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  bucket_id UUID REFERENCES buckets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_bucket_id ON tasks(bucket_id);
CREATE INDEX IF NOT EXISTS idx_buckets_user_id ON buckets(user_id);
CREATE INDEX IF NOT EXISTS idx_buckets_organization_id ON buckets(organization_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_organization_id ON notes(organization_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = organizations.id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Organization creators can update their organizations" ON organizations
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for user_organizations
CREATE POLICY "Users can view their memberships" ON user_organizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view memberships in their organizations" ON user_organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo2
      WHERE uo2.organization_id = user_organizations.organization_id
      AND uo2.user_id = auth.uid()
      AND uo2.role IN ('owner', 'admin')
      AND uo2.is_active = true
    )
  );

CREATE POLICY "Organization owners can manage memberships" ON user_organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo2
      WHERE uo2.organization_id = user_organizations.organization_id
      AND uo2.user_id = auth.uid()
      AND uo2.role IN ('owner', 'admin')
      AND uo2.is_active = true
    )
  );

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their organizations" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = projects.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Organization members can create projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = projects.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Organization admins can update projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = projects.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin')
      AND user_organizations.is_active = true
    )
  );

-- RLS Policies for project_users
CREATE POLICY "Users can view their project memberships" ON project_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Project members can view other members" ON project_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_users pu2
      WHERE pu2.project_id = project_users.project_id
      AND pu2.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage project users" ON project_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN user_organizations uo ON uo.organization_id = p.organization_id
      WHERE p.id = project_users.project_id
      AND uo.user_id = auth.uid()
      AND uo.role IN ('owner', 'admin')
      AND uo.is_active = true
    )
  );

-- RLS Policies for buckets
CREATE POLICY "Users can view buckets in their organizations" ON buckets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = buckets.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Users can create buckets in their organizations" ON buckets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = buckets.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Organization members can update buckets" ON buckets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = buckets.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Organization members can delete buckets" ON buckets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = buckets.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their organizations" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = tasks.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Users can create tasks in their organizations" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = tasks.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notes
CREATE POLICY "Users can view notes in their organizations" ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = notes.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Users can create notes in their organizations" ON notes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = notes.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for invitations
CREATE POLICY "Users can view invitations to their organizations" ON invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = invitations.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin')
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Anyone can view invitations by token" ON invitations
  FOR SELECT USING (true);

CREATE POLICY "Organization admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = invitations.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin')
      AND user_organizations.is_active = true
    )
  );

CREATE POLICY "Organization admins can update invitations" ON invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_organizations.organization_id = invitations.organization_id 
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin')
      AND user_organizations.is_active = true
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buckets_updated_at BEFORE UPDATE ON buckets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
