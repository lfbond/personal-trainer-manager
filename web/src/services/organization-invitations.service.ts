
import { api } from "../lib/api";

export type InvitationRole = "ADMIN" | "TRAINER";

export interface CreateInvitationInput {
  organizationId: string;
  email: string;
  role: InvitationRole;
}

export interface CreateInvitationResponse {
  invitationId: string;
  organization: string;
  email: string;
  role: InvitationRole;
  expiresAt: string;
  token: string;
}

export async function createOrganizationInvitation(
  data: CreateInvitationInput
): Promise<CreateInvitationResponse> {
  const response = await api.post<CreateInvitationResponse>(
    "/admin/invitations",
    data
  );

  return response.data;
}

export function buildInvitationUrl(token: string): string {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error("Token de convite inválido.");
  }

  return `${window.location.origin}/convite/${token}`;
}
