"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// Uploads a logo/signature image to S3 and returns its public URL.
export function useUpload() {
  return useMutation({
    mutationFn: ({
      file,
      kind = "logo",
    }: {
      file: File;
      kind?: "logo" | "signature";
    }) => api.upload(file, kind),
  });
}
