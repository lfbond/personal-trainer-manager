import { useState } from "react";
import axios from "axios";

import { ConfirmModal } from "../ConfirmModal";

import {
  createExerciseImageProposal,
  updateOfficialExerciseImage,
  uploadExerciseImage,
  type ExerciseImagePermissions,
} from "../../services/exercise-image-proposals";

interface Props {
  variationId: string;
  variationName: string;
  imageUrl: string | null;
  permissions: ExerciseImagePermissions;
  onUpdated: () => Promise<void> | void;
}

type Notice = {
  title: string;
  message: string;
};

type DraftState = {
  sourceImageUrl: string | null;
  value: string;
};

type PendingOperation =
  | { type: "URL"; imageUrl: string }
  | { type: "FILE"; file: File }
  | { type: "REMOVE" }
  | null;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedFileTypes = ["image/jpeg", "image/png", "image/webp"];

const localImagePattern =
  /^\/exercises\/[a-zA-Z0-9_/-]+\.(?:jpg|jpeg|png|webp)$/i;

const inputClass =
  "min-h-10 w-full rounded-lg border border-border-default " +
  "bg-surface px-3 py-2 text-sm text-text-primary";

const buttonClass =
  "min-h-10 rounded-lg border border-primary bg-primary " +
  "px-4 py-2 text-sm font-semibold text-white " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const secondaryClass =
  "min-h-10 rounded-lg border border-border-default " +
  "px-4 py-2 text-sm font-semibold " +
  "disabled:cursor-not-allowed disabled:opacity-40";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

function isValidImagePath(value: string): boolean {
  if (!value || value.length > 2048) {
    return false;
  }

  if (localImagePattern.test(value)) {
    return !value.includes("..") && !value.includes("//");
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function ExerciseImageEditor({
  variationId,
  variationName,
  imageUrl,
  permissions,
  onUpdated,
}: Props) {
  const [draft, setDraft] = useState<DraftState>({
    sourceImageUrl: imageUrl,
    value: imageUrl ?? "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [pendingOperation, setPendingOperation] =
    useState<PendingOperation>(null);

  const [saving, setSaving] = useState(false);

  const [failedPreview, setFailedPreview] = useState<string | null>(null);

  const [notice, setNotice] = useState<Notice | null>(null);

  const canEdit = permissions.canManage || permissions.canPropose;

  const draftUrl =
    draft.sourceImageUrl === imageUrl ? draft.value : (imageUrl ?? "");

  const normalizedDraft = draftUrl.trim();
  const currentUrl = imageUrl ?? "";

  const hasChanged = normalizedDraft !== currentUrl;

  const validDraft =
    normalizedDraft.length === 0 || isValidImagePath(normalizedDraft);

  const previewUrl = selectedFile
    ? filePreview
    : normalizedDraft && isValidImagePath(normalizedDraft)
      ? normalizedDraft
      : null;

  function updateDraft(value: string) {
    setDraft({
      sourceImageUrl: imageUrl,
      value,
    });

    setSelectedFile(null);
    setFilePreview(null);
    setFailedPreview(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (!allowedFileTypes.includes(file.type)) {
      setNotice({
        title: "Formato inválido",
        message: "Selecione uma imagem JPG, PNG ou WebP.",
      });

      return;
    }

    if (file.size > MAX_FILE_SIZE || file.size === 0) {
      setNotice({
        title: "Tamanho inválido",
        message: "Selecione uma imagem de até 5 MB.",
      });

      return;
    }

    setSelectedFile(file);
    setFilePreview(null);
    setFailedPreview(null);

    const reader = new FileReader();

    reader.onload = () => {
      setFilePreview(typeof reader.result === "string" ? reader.result : null);
    };

    reader.onerror = () => {
      setSelectedFile(null);
      setFilePreview(null);

      setNotice({
        title: "Erro ao ler imagem",
        message: "Não foi possível carregar a pré-visualização.",
      });
    };

    reader.readAsDataURL(file);
  }

  function resetEditor() {
    setDraft({
      sourceImageUrl: imageUrl,
      value: imageUrl ?? "",
    });

    setSelectedFile(null);
    setFilePreview(null);
    setFailedPreview(null);
  }

  async function confirmOperation() {
    if (!pendingOperation || saving || !canEdit) {
      return;
    }

    setSaving(true);

    let uploadedImageUrl: string | null = null;

    try {
      let nextImageUrl: string | null;

      if (pendingOperation.type === "REMOVE") {
        nextImageUrl = null;
      } else if (pendingOperation.type === "URL") {
        nextImageUrl = pendingOperation.imageUrl;
      } else {
        const uploaded = await uploadExerciseImage(
          variationId,
          pendingOperation.file,
        );

        uploadedImageUrl = uploaded.imageUrl;
        nextImageUrl = uploaded.imageUrl;
      }

      const result = permissions.canManage
        ? await updateOfficialExerciseImage(variationId, nextImageUrl)
        : await createExerciseImageProposal(variationId, nextImageUrl);

      setPendingOperation(null);
      resetEditor();

      setNotice({
        title: permissions.canManage
          ? "Imagem oficial atualizada"
          : "Proposta enviada",
        message: result.message,
      });

      try {
        await onUpdated();
      } catch {
        setNotice({
          title: "Operação registrada",
          message:
            result.message +
            " Atualize o catálogo para consultar os dados recentes.",
        });
      }
    } catch (error) {
      setPendingOperation(null);

      const orphanWarning = uploadedImageUrl
        ? " O arquivo foi enviado, mas não foi associado ao catálogo. Ele precisará ser limpo posteriormente."
        : "";

      setNotice({
        title: "Não foi possível concluir",
        message: getErrorMessage(error) + orphanWarning,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return null;
  }

  const operationLabel =
    pendingOperation?.type === "REMOVE"
      ? "remover"
      : imageUrl
        ? "substituir"
        : "adicionar";

  return (
    <section
      className="mt-4 rounded-lg border border-border-default bg-surface p-4"
      aria-label={`Gerenciar imagem de ${variationName}`}
    >
      <h3 className="text-sm font-semibold">Gerenciamento da imagem</h3>

      <p className="mt-1 text-xs text-text-secondary">
        {permissions.canManage
          ? "Você pode alterar diretamente a imagem oficial."
          : "Sua alteração será enviada para aprovação. A imagem oficial será preservada até a aprovação."}
      </p>

      {/* SELEÇÃO DE ARQUIVO */}

      <label className="mt-4 grid gap-2 text-sm">
        Selecionar imagem do computador
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={saving}
          className={inputClass}
        />
      </label>

      {selectedFile && (
        <div className="mt-2 text-xs text-text-secondary">
          Arquivo selecionado: <strong>{selectedFile.name}</strong>
          {" • "}
          {(selectedFile.size / 1024).toFixed(0)} KB
        </div>
      )}

      {/* CAMINHO EXISTENTE OU URL */}

      <label className="mt-4 grid gap-1 text-sm">
        Ou informar caminho / URL da imagem
        <input
          type="text"
          value={draftUrl}
          onChange={(event) => updateDraft(event.target.value)}
          placeholder="/exercises/01-Peito/01-FW-005.webp"
          maxLength={2048}
          disabled={saving}
          className={inputClass}
        />
      </label>

      <p className="mt-1 text-xs text-text-secondary">
        Aceita caminhos existentes em /exercises/ ou URLs HTTP/HTTPS.
      </p>

      {!validDraft && !selectedFile && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          Informe um caminho /exercises/ válido ou uma URL HTTP/HTTPS.
        </p>
      )}

      {/* PRÉ-VISUALIZAÇÃO */}

      {previewUrl && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold">Pré-visualização</p>

          <div className="flex h-48 max-w-80 items-center justify-center overflow-hidden rounded-lg border border-border-default bg-page">
            {failedPreview === previewUrl ? (
              <p className="p-3 text-center text-xs text-red-500">
                Não foi possível carregar a imagem.
              </p>
            ) : (
              <img
                src={previewUrl}
                alt={`Prévia de ${variationName}`}
                className="h-full w-full object-contain"
                onError={() => setFailedPreview(previewUrl)}
              />
            )}
          </div>
        </div>
      )}

      {/* AÇÕES */}

      <div className="mt-4 flex flex-wrap gap-2">
        {selectedFile ? (
          <button
            type="button"
            disabled={saving || !filePreview}
            className={buttonClass}
            onClick={() =>
              setPendingOperation({
                type: "FILE",
                file: selectedFile,
              })
            }
          >
            {permissions.canManage
              ? "Salvar imagem oficial"
              : "Enviar proposta com arquivo"}
          </button>
        ) : (
          <button
            type="button"
            disabled={saving || !hasChanged || !normalizedDraft || !validDraft}
            className={buttonClass}
            onClick={() =>
              setPendingOperation({
                type: "URL",
                imageUrl: normalizedDraft,
              })
            }
          >
            {permissions.canManage
              ? imageUrl
                ? "Substituir imagem oficial"
                : "Adicionar imagem oficial"
              : "Enviar proposta de imagem"}
          </button>
        )}

        {imageUrl && (
          <button
            type="button"
            disabled={saving}
            className={secondaryClass}
            onClick={() =>
              setPendingOperation({
                type: "REMOVE",
              })
            }
          >
            {permissions.canManage
              ? "Remover imagem oficial"
              : "Solicitar remoção"}
          </button>
        )}

        <button
          type="button"
          disabled={saving || (!hasChanged && !selectedFile)}
          className={secondaryClass}
          onClick={resetEditor}
        >
          Descartar alterações
        </button>
      </div>

      {/* CONFIRMAÇÃO */}

      <ConfirmModal
        open={pendingOperation !== null}
        title="Confirmar alteração de imagem"
        message={
          `Deseja ${operationLabel} a imagem de "${variationName}"?\n\n` +
          (permissions.canManage
            ? "A alteração será aplicada diretamente ao catálogo oficial."
            : "Uma proposta será enviada para aprovação.")
        }
        confirmLabel={
          permissions.canManage ? "Confirmar alteração" : "Enviar proposta"
        }
        loading={saving}
        onConfirm={() => void confirmOperation()}
        onCancel={() => {
          if (!saving) {
            setPendingOperation(null);
          }
        }}
      />

      {/* RESULTADO */}

      <ConfirmModal
        open={notice !== null}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        confirmLabel="Entendi"
        onConfirm={() => setNotice(null)}
        onCancel={() => setNotice(null)}
      />
    </section>
  );
}
