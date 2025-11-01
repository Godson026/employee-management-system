export enum ApprovalStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export interface ApprovalStep {
    approverId: string;
    approverName: string;
    status: ApprovalStatus;
    actionedAt?: Date;
    comments?: string;
}

export interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string | null;
  employee: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
  };
  approval_chain: ApprovalStep[];
  created_at?: string;
  actioned_at?: string;
}

export enum NotificationType {
  LEAVE_REQUEST = 'leave_request',
  LEAVE_SUBMITTED = 'leave_submitted',
  LEAVE_APPROVED = 'leave_approved',
  LEAVE_REJECTED = 'leave_rejected',
  ATTENDANCE_REMINDER = 'attendance_reminder',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
}

export enum AnnouncementPriority {
  INFO = 'info',
  IMPORTANT = 'important',
  URGENT = 'urgent',
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: {
    id: string;
    email: string;
    employee?: {
      first_name: string;
      last_name: string;
    } | null;
  };
}
