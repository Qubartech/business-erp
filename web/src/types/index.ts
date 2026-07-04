export type Role = "admin" | "manager" | "member" | "account";

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type TransactionType = "deposit" | "withdrawal" | "transfer";

export type Account = {
  id: string;
  name: string;
  code: string;
  type: AccountType;
  description: string | null;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  accountId: string;
  toAccountId: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  description: string | null;
  reference: string | null;
  category: string | null;
  spentById: string | null;
  projectId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  account?: Pick<Account, "id" | "name" | "code" | "type">;
  toAccount?: Pick<Account, "id" | "name" | "code" | "type"> | null;
  createdBy?: Pick<User, "id" | "name" | "email">;
  spentBy?: Pick<User, "id" | "name" | "email"> | null;
  project?: Pick<Project, "id" | "name"> | null;
};

export type User = {
  id: string; name: string; email: string; role: Role; isActive: boolean;
  createdAt: string; updatedAt?: string;
  leaves?: Leave[];
};

export type ProjectStatus = "draft" | "active" | "on_hold" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export type ProjectMember = { id: string; userId: string; user: Pick<User, "id" | "name" | "email" | "role"> };

export type Project = {
  id: string; name: string; description: string | null; status: ProjectStatus;
  category: "client" | "non_client";
  startDate: string | null; endDate: string | null; githubRepo: string | null;
  createdAt: string; updatedAt: string;
  creator?: Pick<User, "id" | "name" | "email">;
  members?: ProjectMember[];
  commits?: { committedAt: string; sha: string; message: string; authorName: string }[];
  tasks?: { status: TaskStatus }[];
  _count?: { tasks: number };
};

export type Commit = {
  id: string; projectId: string; sha: string; message: string;
  authorName: string; authorEmail: string; url: string;
  committedAt: string; createdAt: string;
  project?: Pick<Project, "id" | "name">;
};

export type Task = {
  id: string; projectId: string; title: string; description: string | null;
  status: TaskStatus; priority: TaskPriority;
  assignedTo: string | null; dueDate: string | null;
  createdAt: string; updatedAt: string;
  project?: Pick<Project, "id" | "name">;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
  creator?: Pick<User, "id" | "name" | "email">;
};

export type Note = {
  id: string; userId: string; title: string; content: string;
  color: string; category: string; pinned: boolean;
  createdAt: string; updatedAt: string;
};

export type TimeEntry = {
  id: string; taskId: string; userId: string;
  startTime: string; endTime: string | null; durationMinutes: number | null;
  createdAt: string;
  task?: Pick<Task, "id" | "title" | "projectId">;
  user?: Pick<User, "id" | "name">;
};

export type Document = {
  id: string; title: string; filePath: string; mimeType: string | null;
  sizeBytes: number | null; category: string | null;
  projectId: string | null; uploadedBy: string; createdAt: string;
  project?: Pick<Project, "id" | "name"> | null;
  uploader?: Pick<User, "id" | "name" | "email">;
};

export type Setting = { id: string; key: string; value: string; updatedAt: string };

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export type AttendanceEntry = {
  id: string;
  userId: string;
  checkIn: string;
  checkOut: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "name" | "email"> & {
    timeEntries?: Array<Pick<TimeEntry, "id" | "taskId" | "startTime" | "endTime"> & {
      task?: Pick<Task, "id" | "title" | "projectId">;
    }>;
  };
};

export type LeaveType = "sick" | "casual" | "annual" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

export type Leave = {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "name" | "email">;
};

export type Holiday = {
  id: string;
  date: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QubartechTeamMember = {
  id: string;
  name: string;
  position: string;
  image: string | null;
  facebook: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  x: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QubartechProduct = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  features: string | null;
  icon: string | null;
  color: string | null;
  tags: string | null;
  image: string | null;
  link: string | null;
  status: string;
  privacyPolicy: string | null;
  isActive: boolean;
  hasProjectManagement: boolean;
  hasPrivacy: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  type: "attendance" | "project" | "task" | "note" | "document" | "commit" | "transaction";
  action: string;
  userId: string | null;
  projectId: string | null;
  description: string;
  metadata?: any;
  createdAt: string;
  user?: Pick<User, "id" | "name" | "email"> | null;
  project?: Pick<Project, "id" | "name"> | null;
};

