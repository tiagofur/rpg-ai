import { useMutation } from "@tanstack/react-query";
import type {
  CreateSessionInput,
  CreateSessionResponse
} from "@rpg-ai/shared";

import { postJson } from "../api/client";

export function useCreateSession() {
  return useMutation<CreateSessionResponse, Error, CreateSessionInput>({
    mutationFn: async (payload) => postJson("/api/session/create", payload)
  });
}
