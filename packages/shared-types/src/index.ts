export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  preferredLanguage: string;
  role: 'citizen' | 'admin' | 'mp';
  isVerified: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in_review' | 'in_progress' | 'resolved' | 'rejected';
  location?: GeoPoint;
  address?: string;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed';
  location?: GeoPoint;
  ward: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface Analytics {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  complaintsByCategory: Record<string, number>;
  complaintsByWard: Record<string, number>;
  resolutionRate: number;
  averageResolutionDays: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
