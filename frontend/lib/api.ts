/**
 * lib/api.ts — Central API client for AdVance.
 * - All requests go to NEXT_PUBLIC_API_URL
 * - credentials: "include" sends httpOnly cookies automatically
 * - Throws ApiClientError on non-2xx responses
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
export const BACKEND_ORIGIN = new URL(BASE_URL).origin;

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `${BACKEND_ORIGIN}${url}`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiClientError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    super((data.error as string) ?? "An unexpected error occurred");
    this.status = status;
    this.data   = data;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: Record<string, unknown> | FormData;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const isFormData  = body instanceof FormData;
  const csrfToken   = method === "GET" ? null : getCookie("csrf_access_token");

  const fetchOptions: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(!isFormData && body ? { "Content-Type": "application/json" } : {}),
      ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
      ...headers,
    },
    ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, fetchOptions);

  if (res.status === 204) return undefined as unknown as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new ApiClientError(res.status, data);

  return data as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  /** Register a new agency and its first admin. */
  registerCompany: (payload: {
    company_name: string;
    company_email: string;
    company_phone?: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
  }) =>
    request<import("@/types").CompanyRegisterResponse>("/api/auth/register/company", {
      method: "POST",
      body: payload,
    }),

  /** Register a client under a specific agency (requires company_slug). */
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    company_slug: string;
    phone?: string;
    company_name?: string;
  }) =>
    request<import("@/types").RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: payload,
    }),

  registerStaffWithKey: (payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    staff_key: string;
  }) =>
    request<import("@/types").RegisterResponse>("/api/auth/register/staff", {
      method: "POST",
      body: payload,
    }),

  registerInternal: (payload: {
    full_name: string;
    email: string;
    password: string;
    role: "staff" | "admin";
    phone?: string;
  }) =>
    request<import("@/types").RegisterResponse>("/api/auth/register/internal", {
      method: "POST",
      body: payload,
    }),

  login: (email: string, password: string) =>
    request<{ user: import("@/types").User }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  me: () => request<import("@/types").User>("/api/auth/me"),

  logout: () =>
    request<{ message: string }>("/api/auth/logout", { method: "POST" }),

  updateProfile: (formData: FormData) =>
    request<{ message: string; user: import("@/types").User }>("/api/auth/me", {
      method: "PATCH",
      body: formData,
    }),

  getStaffKey: () =>
    request<{ staff_key: string | null; enabled: boolean }>("/api/auth/staff-key"),

  rotateStaffKey: () =>
    request<{ staff_key: string }>("/api/auth/staff-key/rotate", { method: "POST" }),
};

// ─── Companies ─────────────────────────────────────────────────────────────

export const companiesApi = {
  getMe: () => request<import("@/types").Company>("/api/companies/me"),

  updateMe: (payload: { name?: string; email?: string; phone?: string; address?: string }) =>
    request<{ message: string; company: import("@/types").Company }>("/api/companies/me", {
      method: "PATCH",
      body: payload,
    }),
};

// ─── Superadmin ────────────────────────────────────────────────────────────

export const superadminApi = {
  stats: () => request<import("@/types").PlatformStats>("/api/superadmin/stats"),

  listCompanies: () => request<import("@/types").Company[]>("/api/superadmin/companies"),

  toggleCompanyActive: (id: string) =>
    request<{ message: string; company: import("@/types").Company }>(
      `/api/superadmin/companies/${id}/toggle-active`,
      { method: "PATCH" }
    ),
};

// ─── Campaigns ─────────────────────────────────────────────────────────────

export const campaignsApi = {
  submit: (formData: FormData) =>
    request<{ message: string; campaign: import("@/types").Campaign }>("/api/campaigns/", {
      method: "POST",
      body: formData,
    }),

  listAll: (status?: string) =>
    request<import("@/types").Campaign[]>(
      `/api/campaigns/${status ? `?status=${status}` : ""}`
    ),

  listMine: () => request<import("@/types").Campaign[]>("/api/campaigns/my"),

  getOne: (id: string) => request<import("@/types").Campaign>(`/api/campaigns/${id}`),

  approve: (id: string) =>
    request<{ message: string }>(`/api/campaigns/${id}/approve`, { method: "PATCH" }),

  reject: (id: string, reason: string) =>
    request<{ message: string }>(`/api/campaigns/${id}/reject`, {
      method: "PATCH",
      body: { reason },
    }),

  complete: (id: string) =>
    request<{ message: string }>(`/api/campaigns/${id}/complete`, { method: "PATCH" }),
};

// ─── Locations ─────────────────────────────────────────────────────────────

export const locationsApi = {
  list: () => request<import("@/types").Location[]>("/api/locations/"),

  create: (formData: FormData) =>
    request<{ message: string; location: import("@/types").Location }>("/api/locations/", {
      method: "POST",
      body: formData,
    }),

  update: (id: string, payload: Partial<import("@/types").Location>) =>
    request<{ message: string; location: import("@/types").Location }>(`/api/locations/${id}`, {
      method: "PATCH",
      body: payload,
    }),
};

// ─── Tasks ─────────────────────────────────────────────────────────────────

export const tasksApi = {
  assign: (payload: {
    campaign_location_id: string;
    assigned_to: string;
    instructions?: string;
  }) =>
    request<{ message: string; task: import("@/types").Task }>("/api/tasks/", {
      method: "POST",
      body: payload,
    }),

  listAll: () => request<import("@/types").Task[]>("/api/tasks/"),

  listMine: () => request<import("@/types").Task[]>("/api/tasks/my"),

  updateStatus: (id: string, status: import("@/types").TaskStatus) =>
    request<{ message: string }>(`/api/tasks/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
};

// ─── Deployments ───────────────────────────────────────────────────────────

export const deploymentsApi = {
  upload: (formData: FormData) =>
    request<{ message: string; deployment: import("@/types").Deployment }>("/api/deployments/", {
      method: "POST",
      body: formData,
    }),

  byCampaign: (campaignId: string) =>
    request<import("@/types").Deployment[]>(`/api/deployments/campaign/${campaignId}`),
};

// ─── Notifications ─────────────────────────────────────────────────────────

export const notificationsApi = {
  list: () => request<import("@/types").Notification[]>("/api/notifications/"),

  markRead: (id: string) =>
    request<{ message: string }>(`/api/notifications/${id}/read`, { method: "PATCH" }),

  markAllRead: () =>
    request<{ message: string }>("/api/notifications/read-all", { method: "PATCH" }),
};

// ─── Analytics ─────────────────────────────────────────────────────────────

export const analyticsApi = {
  overview: () => request<import("@/types").AnalyticsOverview>("/api/analytics/overview"),
};

// ─── Users ─────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (role?: import("@/types").UserRole) =>
    request<import("@/types").User[]>(`/api/users/${role ? `?role=${role}` : ""}`),

  toggleActive: (id: string) =>
    request<{ message: string; user: Pick<import("@/types").User, "id" | "full_name" | "is_active"> }>(
      `/api/users/${id}/toggle-active`,
      { method: "PATCH" }
    ),

  setPrimeStaff: (id: string, is_prime_staff: boolean) =>
    request<{ message: string; user: Pick<import("@/types").User, "id" | "is_prime_staff"> }>(
      `/api/users/${id}/prime-staff`,
      { method: "PATCH", body: { is_prime_staff } }
    ),
};
