
import { api } from "../lib/api";

export type OrganizationRole = "OWNER" | "ADMIN" | "TRAINER";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    members: number;
    students: number;
  };
}

export interface OrganizationMember {
  id: string;
  role: OrganizationRole;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    trainer: {
      id: string;
    } | null;
  };
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  ownerUserId: string;
}

export interface CreateTrainerInput {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "TRAINER";
}

export interface UpdateMemberInput {
  isActive?: boolean;
  role?: "ADMIN" | "TRAINER";
}

export interface EligibleOwner {
  id: string;
  name: string;
  email: string;
}

export async function getOrganizations(): Promise<Organization[]> {
  const response = await api.get<Organization[]>(
    "/admin/organizations"
  );

  return response.data;
}

export async function createOrganization(
  data: CreateOrganizationInput
): Promise<Organization> {
  const response = await api.post<Organization>(
    "/admin/organizations",
    data
  );

  return response.data;
}

export async function getOrganizationMembers(
  organizationId: string
): Promise<OrganizationMember[]> {
  const response = await api.get<OrganizationMember[]>(
    `/organizations/${organizationId}/members`
  );

  return response.data;
}

export async function createTrainer(
  organizationId: string,
  data: CreateTrainerInput
) {
  const response = await api.post(
    `/organizations/${organizationId}/trainers`,
    data
  );

  return response.data;
}

export async function updateOrganizationMember(
  organizationId: string,
  memberId: string,
  data: UpdateMemberInput
) {
  const response = await api.patch(
    `/organizations/${organizationId}/members/${memberId}`,
    data
  );

  return response.data;
}

export async function getEligibleOwners(): Promise<EligibleOwner[]> {
  const response = await api.get<EligibleOwner[]>(
    "/admin/organizations/eligible-owners"
  );

  return response.data;
}
