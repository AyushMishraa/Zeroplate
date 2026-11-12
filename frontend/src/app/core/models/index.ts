// ---------------------------------------------------------------------------
// Shared types. These mirror the shapes the Express backend (backend/) returns.
// ---------------------------------------------------------------------------

export type UserRole = 'donor' | 'receiver' | 'admin';
export type FoodStatus = 'available' | 'claimed' | 'picked_up' | 'expired';
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// User Models
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  provider: 'local' | 'google';
  googleId?: string;
  location?: GeoPoint;
  isNewUser?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  message: string;
  user?: User & { token?: string };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  location: GeoPoint;
}

// Food Models
export interface DonorRef {
  _id: string;
  name: string;
  email: string;
}

export interface FoodItem {
  _id: string;
  title: string;
  type?: string;
  quantity: number;
  status: FoodStatus;
  donor: DonorRef | string;
  expirationDate: Date | string;
  pickupLocation: string;
  location?: GeoPoint;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateFoodData {
  title: string;
  type?: string;
  quantity: number;
  expirationDate: Date | string;
  pickupLocation: string;
  location?: GeoPoint;
}

export type UpdateFoodData = Partial<Pick<FoodItem, 'title' | 'type' | 'quantity' | 'status' | 'pickupLocation'>> & {
  expirationDate?: Date | string;
};

/** One entry of the matching engine's ranked list (backend services/matchingService.ts). */
export interface RecommendedNGO {
  ngoId: string;
  distance: number; // km
  expiryUrgency: number;
  foodTypeScore: number;
  finalScore: number;
}

export interface FoodResponse {
  success?: boolean;
  message?: string;
  food: FoodItem[] | FoodItem;
  recommendedNGOs?: RecommendedNGO[];
}

// Claim Models
export interface Claim {
  _id: string;
  food: FoodItem | string | null;
  receiver: DonorRef | string;
  status: ClaimStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ClaimResponse {
  success?: boolean;
  message?: string;
  claim?: Claim;
  claims?: Claim[];
}

// Admin Dashboard Models
export interface DashboardStats {
  totalUsers: number;
  totalFoodItems: number;
  totalClaims: number;
  pendingPickups: number;
  successfulPickups: number;
  expiredFood: number;
  foodByType: { _id: string | null; count: number }[];
  donationsPerDay: { _id: string; count: number; totalQuantity: number }[];
}

export interface PendingPickup {
  _id: string;
  food: {
    _id?: string;
    title: string;
    donor?: { name: string; email: string } | null;
  } | null;
  receiver: { name: string; email: string } | null;
  status: ClaimStatus;
  createdAt: Date | string;
}

// Analytics Models
export interface AnalyticsSummary {
  totalDonations: number;
  totalClaims: number;
  totalMealsSaved: number;
  activeDonors: number;
  activeReceivers: number;
}

export interface TopDonor {
  donorId: string;
  donor: { _id: string; name: string; email: string };
  totalQuantity: number;
  donationsCount: number;
}

export interface DuplicateClaimGroup {
  _id: { food: string; receiver: string };
  count: number;
}

export interface RapidClaimUser {
  _id: string;
  recentClaims: number;
}

export interface SuspiciousDonor {
  _id: string;
  totalDonations: number;
  totalQuantity: number;
  pickedUpCount: number;
}

export interface FraudData {
  duplicateClaimsCount: number;
  duplicateClaims: DuplicateClaimGroup[];
  rapidClaimUsersCount: number;
  rapidClaimUsers: RapidClaimUser[];
  suspiciousDonorsCount: number;
  suspiciousDonors: SuspiciousDonor[];
}

// API Response Wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Helpers -------------------------------------------------------------------

export function refId(ref: { _id: string } | string | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref._id;
}

export function isFoodObject(food: Claim['food']): food is FoodItem {
  return !!food && typeof food === 'object';
}
