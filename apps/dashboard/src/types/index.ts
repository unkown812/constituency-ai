export interface ComplaintStat {
  date: string;
  count: number;
}

export interface ComplaintCategoryBreakdown {
  category: string;
  count: number;
  color: string;
}

export interface ConstituencyOverview {
  constituencyName: string;
  mpName: string;
  avatarUrl: string;
  totalComplaintsThisMonth: number;
  totalComplaintsChange: number; // e.g. +12%
  activeProjects: number;
  activeProjectsChange: number;
  budgetUtilised: number; // in crores/lakhs INR
  budgetUtilisedPercent: number; // e.g. 64%
  topIssues: {
    category: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

export interface ComplaintGeo {
  type: "Feature";
  properties: {
    id: string;
    category: "Roads" | "Water" | "Health" | "Education" | "Sanitation" | "Power";
    severity: "High" | "Medium" | "Low";
    description: string;
    ward: string;
    village: string;
    date: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface ProjectRecommendation {
  id: string;
  projectName: string;
  priorityScore: number; // 0-100
  category: string;
  estimatedCost: string; // in INR
  affectedPopulation: number;
  urgency: "Immediate" | "Medium" | "Long-term";
  infrastructureDeficitScore: number; // 0-10
  explainableAI: string; // Detailed Gemini justification
}

export interface InfrastructureGap {
  facilityType: string;
  currentCount: number;
  requiredCount: number;
}

export interface UnderservedArea {
  wardName: string;
  villageName: string;
  deficitScore: number; // 0-10
  missingFacilities: string[];
  severity: "Critical" | "High" | "Medium";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  richData?: {
    type: "chart" | "map" | "table" | "report";
    title?: string;
    chartData?: any[];
    mapData?: any[];
    tableData?: any[];
    reportHtml?: string;
  };
}
