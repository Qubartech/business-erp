-- Helper function to get role securely without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.users WHERE id = user_id;
$$;

-- Enable RLS on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "time_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leaves" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "holidays" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "qubartech_team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "qubartech_products" ENABLE ROW LEVEL SECURITY;

-- 1. users Policies
CREATE POLICY "Users can view their own profile" ON "users" FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON "users" FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Users can update their own profile" ON "users" FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can update any profile" ON "users" FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin') WITH CHECK (true);
CREATE POLICY "Admins can insert profiles" ON "users" FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can delete profiles" ON "users" FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Allow registration (insert)" ON "users" FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 2. refresh_tokens Policies
CREATE POLICY "Users can manage their own refresh tokens" ON "refresh_tokens" FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. projects Policies
CREATE POLICY "Users can view projects they belong to or created" ON "projects" FOR SELECT TO authenticated USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Users can insert projects" ON "projects" FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Project creators or admins can update projects" ON "projects" FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin') WITH CHECK (created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Project creators or admins can delete projects" ON "projects" FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- 4. project_members Policies
CREATE POLICY "Users can view project members of their projects" ON "project_members" FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Project creators or admins can manage project members" ON "project_members" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.created_by = auth.uid()) OR public.get_user_role(auth.uid()) = 'admin') WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.created_by = auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

-- 5. tasks Policies
CREATE POLICY "Users can view tasks in projects they belong to" ON "tasks" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid()))) OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Project members can insert tasks" ON "tasks" FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND (EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid()) OR public.get_user_role(auth.uid()) = 'admin'));
CREATE POLICY "Creators, assignees, or admins can update tasks" ON "tasks" FOR UPDATE TO authenticated USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.get_user_role(auth.uid()) = 'admin') WITH CHECK (created_by = auth.uid() OR assigned_to = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Creators or admins can delete tasks" ON "tasks" FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- 6. notes Policies
CREATE POLICY "Users can manage their own notes" ON "notes" FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 7. time_entries Policies
CREATE POLICY "Users can manage their own time entries" ON "time_entries" FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 8. documents Policies
CREATE POLICY "Users can view documents in their projects or uploaded by them" ON "documents" FOR SELECT TO authenticated USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid()))) OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Users can upload documents" ON "documents" FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Uploaders or admins can update documents" ON "documents" FOR UPDATE TO authenticated USING (uploaded_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin') WITH CHECK (uploaded_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Uploaders or admins can delete documents" ON "documents" FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- 9. settings Policies
CREATE POLICY "Authenticated users can read settings" ON "settings" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON "settings" FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin') WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 10. commits Policies
CREATE POLICY "Users can view commits of projects they belong to" ON "commits" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND (p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid()))) OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "System can manage commits" ON "commits" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. attendance Policies
CREATE POLICY "Users can view and manage their own attendance" ON "attendance" FOR ALL TO authenticated USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'manager')) WITH CHECK (user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- 12. leaves Policies
CREATE POLICY "Users can view their own leaves, admins/managers can view all" ON "leaves" FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "Users can request leaves" ON "leaves" FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "Users can update their pending leaves, admins/managers can update all" ON "leaves" FOR UPDATE TO authenticated USING ( (user_id = auth.uid() AND status = 'pending') OR public.get_user_role(auth.uid()) IN ('admin', 'manager') ) WITH CHECK ( (user_id = auth.uid() AND status = 'pending') OR public.get_user_role(auth.uid()) IN ('admin', 'manager') );
CREATE POLICY "Users can delete their pending leaves, admins/managers can delete all" ON "leaves" FOR DELETE TO authenticated USING ( (user_id = auth.uid() AND status = 'pending') OR public.get_user_role(auth.uid()) IN ('admin', 'manager') );

-- 13. holidays Policies
CREATE POLICY "Anyone can view holidays" ON "holidays" FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins/managers can manage holidays" ON "holidays" FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'manager')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- 14. accounts Policies
CREATE POLICY "Admins/managers/accounts can view and manage accounts" ON "accounts" FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'account')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'account'));

-- 15. transactions Policies
CREATE POLICY "Admins/managers/accounts can view and manage transactions" ON "transactions" FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'account')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'account'));

-- 16. qubartech_team_members Policies
CREATE POLICY "Anyone can view active team members" ON "qubartech_team_members" FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage team members" ON "qubartech_team_members" FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'manager')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- 17. qubartech_products Policies
CREATE POLICY "Anyone can view active products" ON "qubartech_products" FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage products" ON "qubartech_products" FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'manager')) WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));
