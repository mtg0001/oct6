import { useState, useEffect } from "react";
import {
  getUsuarios,
  subscribeUsuarios,
  getCurrentUser,
  ensureUsuariosLoaded,
  type Usuario,
} from "@/stores/usuariosStore";

export function useUsuarios() {
  const [data, setData] = useState<Usuario[]>(getUsuarios());

  useEffect(() => {
    ensureUsuariosLoaded().then(() => setData(getUsuarios()));
    return subscribeUsuarios(() => setData(getUsuarios()));
  }, []);

  return data;
}

export function useCurrentUser() {
  const [data, setData] = useState<Usuario | undefined>(getCurrentUser());

  useEffect(() => {
    ensureUsuariosLoaded().then(() => setData(getCurrentUser()));
    return subscribeUsuarios(() => setData(getCurrentUser()));
  }, []);

  return data;
}
