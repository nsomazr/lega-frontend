/**
 * Role-based access control utilities
 */

export const ROLES = {
  ADMIN: 'admin',
  LAWYER: 'lawyer',
  STAFF: 'staff',
  CLIENT: 'client',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * Check if user has lawyer or admin role
 */
export function isLawyerOrAdmin(role: string): boolean {
  return role === ROLES.ADMIN || role === ROLES.LAWYER;
}

/**
 * Check if user is admin
 */
export function isAdmin(role: string): boolean {
  return role === ROLES.ADMIN;
}

/**
 * Check if user is lawyer
 */
export function isLawyer(role: string): boolean {
  return role === ROLES.LAWYER;
}

/**
 * Check if user is client
 */
export function isClient(role: string): boolean {
  return role === ROLES.CLIENT;
}

/**
 * Check if user is staff
 */
export function isStaff(role: string): boolean {
  return role === ROLES.STAFF;
}

/**
 * Check if user can create cases (lawyer or admin)
 */
export function canCreateCases(role: string): boolean {
  return isLawyerOrAdmin(role);
}

/**
 * Check if user can create templates (lawyer or admin)
 */
export function canCreateTemplates(role: string): boolean {
  return isLawyerOrAdmin(role);
}

/**
 * Check if user can upload documents (lawyer or admin)
 */
export function canUploadDocuments(role: string): boolean {
  return isLawyerOrAdmin(role);
}

/**
 * Check if user can manage users (admin only)
 */
export function canManageUsers(role: string): boolean {
  return isAdmin(role);
}

