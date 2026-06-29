// ─── Enums (mirror backend Python enums) ───────────────────────────────────

export type UserRole = "superadmin" | "admin" | "staff" | "client";

export type LocationFormat =
  | "billboard"
  | "transit"
  | "street_furniture"
  | "digital";

export type CampaignStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "active"
  | "pending_completion"
  | "completed";

export type CampaignLocationStatus =
  | "pending"
  | "assigned"
  | "deployed"
  | "completed";

export type TaskStatus = "pending" | "in_progress" | "completed";

export type NotificationType =
  | "campaign_submitted"
  | "campaign_approved"
  | "campaign_rejected"
  | "task_assigned"
  | "deployment_uploaded"
  | "campaign_completed";

// ─── Models ────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Extended fields returned by superadmin endpoints
  user_count?: number;
  campaign_count?: number;
}

export interface User {
  id: string;
  company_id: string | null;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  company_name: string | null; // client's own brand/business name
  profile_picture_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_prime_staff?: boolean;
  // Staff-only fields
  address?: string | null;
  department?: string | null;
  skills?: string | null;
  staff_about?: string | null;
}

export interface Location {
  id: string;
  company_id: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  format_type: LocationFormat;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  is_available: boolean;
  daily_rate: number | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  company_id: string;
  client_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  creative_url: string | null;
  creative_filename: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (returned by some endpoints)
  client_name?: string;
  client_email?: string;
  locations?: CampaignLocationDetail[];
}

export interface CampaignLocation {
  id: string;
  campaign_id: string;
  location_id: string;
  status: CampaignLocationStatus;
  created_at: string;
}

export interface CampaignLocationDetail extends Location {
  campaign_location_id: string;
  status: CampaignLocationStatus;
}

export interface Task {
  id: string;
  campaign_location_id: string;
  assigned_to: string;
  assigned_by: string;
  instructions: string | null;
  status: TaskStatus;
  assigned_at: string;
  completed_at: string | null;
  created_at: string;
  // Joined fields
  location_name?: string;
  location_address?: string;
  latitude?: number | null;
  longitude?: number | null;
  campaign_title?: string;
  start_date?: string;
  end_date?: string;
  creative_url?: string | null;
  staff_name?: string;
}

export interface Deployment {
  id: string;
  task_id: string;
  uploaded_by: string;
  photo_url: string;
  photo_filename: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  deployed_at: string;
  created_at: string;
  // Joined fields
  uploaded_by_name?: string;
  location_name?: string;
  location_address?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export interface AnalyticsOverview {
  campaigns: {
    total_campaigns: number;
    pending_review: number;
    approved: number;
    active: number;
    completed: number;
    rejected: number;
  };
  tasks: {
    total_tasks: number;
    pending_tasks: number;
    in_progress_tasks: number;
    completed_tasks: number;
  };
  locations: {
    total_locations: number;
    available_locations: number;
    unavailable_locations: number;
  };
  users: {
    total_clients: number;
    total_staff: number;
  };
}

export interface PlatformStats {
  total_companies: number;
  active_companies: number;
  total_users: number;
  total_campaigns: number;
}

// ─── API response wrappers ─────────────────────────────────────────────────

export interface ApiError {
  error: string;
  conflicts?: Array<{
    location_id: string;
    location_name: string;
    campaign_id: string;
    campaign_title: string;
    campaign_status: CampaignStatus;
    start_date: string;
    end_date: string;
  }>;
}

export interface LoginResponse {
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: Pick<User, "id" | "full_name" | "email" | "role">;
}

export interface CompanyRegisterResponse {
  message: string;
  company: Company;
  user: User;
}
