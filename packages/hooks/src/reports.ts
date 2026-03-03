import { useMutation } from "@tanstack/react-query";
import { useApi } from "./context";
import type { ReportReason, ReportTargetType } from "./types";

export function useSubmitReport() {
  const api = useApi();
  return useMutation({
    mutationFn: (data: {
      targetType: ReportTargetType;
      targetId: string;
      reason: ReportReason;
      description: string;
    }) => api.reports.submit(data),
  });
}

export function useSubmitDmca() {
  const api = useApi();
  return useMutation({
    mutationFn: (data: {
      targetType: "repository" | "gist";
      targetId: string;
      copyrightHolder: string;
      copyrightHolderEmail: string;
      copyrightHolderAddress: string;
      copyrightHolderPhone?: string | null;
      originalWorkDescription: string;
      originalWorkUrl?: string | null;
      infringingUrls: string;
      description: string;
      swornStatement: boolean;
      perjuryStatement: boolean;
      signature: string;
    }) => api.dmca.submit(data),
  });
}
