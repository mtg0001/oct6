import { useState, useEffect } from "react";
import {
  getUsuarios,
  subscribeUsuarios,
  getCurrentUser,
  ensureUsuariosLoaded,
  resolveCurrentUser,
  setCurrentUsuarioFromAuth,
  type Usuario,
} from "@/stores/usuariosStore";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  useEffect(() => {
    ensureUsuariosLoaded().then(async () => {
      if (user?.id) {
        setCurrentUsuarioFromAuth(user.id);
      }
      await resolveCurrentUser();
      setData(getCurrentUser());
    });
    return subscribeUsuarios(() => setData(getCurrentUser()));
  }, [user?.id]);

  return data;
}
