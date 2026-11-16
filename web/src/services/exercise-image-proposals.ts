
import { api } from "../lib/api";

export type ImageProposalAction =
  | "ADD"
  | "REPLACE"
  | "REMOVE";

export type ImageProposalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface ExerciseImagePermissions {
  canManage: boolean;
  canPropose: boolean;
  canApprove: boolean;
}

export interface ExerciseImageProposal {
  id: string;
  exerciseVariationId: string;
  proposedById: string;
  reviewedById: string | null;
  action: ImageProposalAction;
  proposedImageUrl: string | null;
  previousImageUrl: string | null;
  status: ImageProposalStatus;
  reviewNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  exerciseVariation: {
    id: string;
    name: string;
    code: string;
    imageUrl: string | null;
    exercise: {
      name: string;
    };
  };
  proposedBy: {
    id: string;
    name: string;
  };
  reviewedBy: {
    id: string;
    name: string;
  } | null;
}

export interface ImageProposalResponse {
  message: string;
  proposal: ExerciseImageProposal;
}

export interface ImageProposalListResponse {
  total: number;
  proposals: ExerciseImageProposal[];
}

export interface OfficialImageResponse {
  message: string;
  variation: {
    id: string;
    imageUrl: string | null;
    imageReviewStatus:
      | "PENDING"
      | "APPROVED"
      | "REJECTED";
    imageReviewNotes: string | null;
    imageReviewedAt: string | null;
  };
}

export interface ImageUploadResponse {
  message: string;
  imageUrl: string;
}

export async function getExerciseImagePermissions():
  Promise<ExerciseImagePermissions> {
  const response =
    await api.get<ExerciseImagePermissions>(
      "/exercises/images/permissions",
    );

  return response.data;
}

export async function uploadExerciseImage(
  variationId: string,
  file: File,
): Promise<ImageUploadResponse> {
  const response =
    await api.post<ImageUploadResponse>(
      `/exercises/images/variations/${variationId}/upload`,
      file,
      {
        headers: {
          "Content-Type": file.type,
        },
        timeout: 30000,
      },
    );

  return response.data;
}

export async function createExerciseImageProposal(
  variationId: string,
  imageUrl: string | null,
): Promise<ImageProposalResponse> {
  const response =
    await api.post<ImageProposalResponse>(
      `/exercises/images/variations/${variationId}/proposals`,
      { imageUrl },
    );

  return response.data;
}

export async function updateOfficialExerciseImage(
  variationId: string,
  imageUrl: string | null,
): Promise<OfficialImageResponse> {
  const response =
    await api.patch<OfficialImageResponse>(
      `/exercises/images/variations/${variationId}/official`,
      { imageUrl },
    );

  return response.data;
}

export async function getExerciseImageProposals(
  status?: ImageProposalStatus,
): Promise<ImageProposalListResponse> {
  const response =
    await api.get<ImageProposalListResponse>(
      "/exercises/images/proposals",
      {
        params: status ? { status } : undefined,
      },
    );

  return response.data;
}

export async function reviewExerciseImageProposal(
  proposalId: string,
  decision: "APPROVED" | "REJECTED",
  notes?: string,
): Promise<ImageProposalResponse> {
  const response =
    await api.patch<ImageProposalResponse>(
      `/exercises/images/proposals/${proposalId}/review`,
      {
        decision,
        notes: notes?.trim() || null,
      },
    );

  return response.data;
}
