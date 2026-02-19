import { useSyncExternalStore } from "react";
import { getUsuarios, subscribeUsuarios, getCurrentUser } from "@/stores/usuariosStore";

export function useUsuarios() {
  return useSyncExternalStore(subscribeUsuarios, getUsuarios);
}

export function useCurrentUser() {
  return useSyncExternalStore(subscribeUsuarios, getCurrentUser);
}
