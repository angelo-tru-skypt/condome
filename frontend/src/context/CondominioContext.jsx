import { createContext, useCallback, useContext, useEffect, useState } from "react";
import condominioService from "../utils/condominioService";
import { useAuth } from "./AuthContext";
import { ENABLE_CONDOMINIO_API } from "../config/api";
import { isResidentRole } from "../utils/roles";

const CondominioContext = createContext(null);
const ACTIVE_CONDOMINIO_KEY = "condome.activeCondominioId";

export function CondominioProvider({ children }) {
  const { isAuth, user } = useAuth();
  const [condominios, setCondominios]   = useState([]);
  const [condominio, setCondominio]     = useState(null);
  const [edificios, setEdificios]       = useState([]);
  const [apartamentos, setApartamentos] = useState([]);
  const [residentes, setResidentes]     = useState([]);
  const [activeCondominioId, setActiveCondominioId] = useState("");
  const [loading, setLoading]           = useState(true);

  const persistActiveCondominioId = useCallback((value) => {
    const safeValue = value ? String(value) : "";
    setActiveCondominioId(safeValue);
    try {
      if (safeValue) {
        window.localStorage.setItem(ACTIVE_CONDOMINIO_KEY, safeValue);
      } else {
        window.localStorage.removeItem(ACTIVE_CONDOMINIO_KEY);
      }
    } catch (error) {
      void error;
    }
  }, []);

  const fetchCondominio = useCallback(async (preferredId = null) => {
    try {
      const res = await condominioService.listar();
      const records = res?.data || [];
      setCondominios(records);
      if (!records.length) {
        persistActiveCondominioId("");
        setCondominio(null);
        return null;
      }

      let targetId = preferredId ? String(preferredId) : activeCondominioId;
      if (!targetId) {
        try {
          targetId = window.localStorage.getItem(ACTIVE_CONDOMINIO_KEY) || "";
        } catch (error) {
          void error;
        }
      }

      const fallbackId = String(records[0].id);
      const nextId = records.some((item) => String(item.id) === String(targetId)) ? String(targetId) : fallbackId;
      const record = records.find((item) => String(item.id) === nextId) || records[0] || null;
      persistActiveCondominioId(nextId);
      setCondominio(record);
      return record;
    } catch (err) {
      setCondominios([]);
      persistActiveCondominioId("");
      setCondominio(null);
      return null;
    }
  }, [activeCondominioId, persistActiveCondominioId]);

  const fetchEdificios = useCallback(async (condominioId) => {
    if (!condominioId) {
      setEdificios([]);
      return [];
    }
    try {
      const res = await condominioService.listarEdificios(condominioId);
      setEdificios(res?.data || []);
      return res?.data || [];
    } catch (err) {
      setEdificios([]);
      return [];
    }
  }, []);

  const fetchApartamentos = useCallback(async (condominioId) => {
    if (!condominioId) {
      setApartamentos([]);
      return [];
    }
    try {
      const res = await condominioService.listarApartamentos(condominioId);
      setApartamentos(res?.data || []);
      return res?.data || [];
    } catch (err) {
      setApartamentos([]);
      return [];
    }
  }, []);

  const fetchResidentes = useCallback(async (condominioId) => {
    if (!condominioId) {
      setResidentes([]);
      return [];
    }
    try {
      const res = await condominioService.listarResidentes(condominioId);
      setResidentes(res?.data || []);
      return res?.data || [];
    } catch (err) {
      setResidentes([]);
      return [];
    }
  }, []);

  const refreshCondominio = useCallback(async () => {
    if (!isAuth || !ENABLE_CONDOMINIO_API || isResidentRole(user?.role || user?.rol)) {
      setCondominios([]);
      setCondominio(null);
      setEdificios([]);
      setApartamentos([]);
      setResidentes([]);
      persistActiveCondominioId("");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const current = await fetchCondominio();
      if (current?.id) {
        await fetchEdificios(current.id);
        await fetchApartamentos(current.id);
        await fetchResidentes(current.id);
      } else {
        setEdificios([]);
        setApartamentos([]);
        setResidentes([]);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchApartamentos, fetchCondominio, fetchEdificios, fetchResidentes, isAuth, persistActiveCondominioId, user]);

  useEffect(() => {
    refreshCondominio();
  }, [refreshCondominio]);

  const crearCondominio = useCallback(async (payload) => {
    const result = await condominioService.crear(payload);
    await fetchCondominio(result?.data?.id);
    const nextId = result?.data?.id || activeCondominioId;
    if (nextId) {
      await fetchEdificios(nextId);
      await fetchApartamentos(nextId);
      await fetchResidentes(nextId);
    }
    return result;
  }, [activeCondominioId, fetchApartamentos, fetchCondominio, fetchEdificios, fetchResidentes]);

  const actualizarCondominio = useCallback(async (id, payload) => {
    const result = await condominioService.actualizar(id, payload);
    await fetchCondominio(id);
    await fetchEdificios(id);
    await fetchApartamentos(id);
    await fetchResidentes(id);
    return result;
  }, [fetchApartamentos, fetchCondominio, fetchEdificios, fetchResidentes]);

  const crearEdificio = useCallback(async (payload) => {
    if (!condominio?.id) {
      throw new Error("Primero debes registrar un condominio");
    }
    const result = await condominioService.crearEdificio(condominio.id, payload);
    await refreshCondominio();
    return result;
  }, [condominio?.id, refreshCondominio]);

  const crearApartamento = useCallback(async (payload) => {
    if (!condominio?.id) {
      throw new Error("Primero debes registrar un condominio");
    }
    const result = await condominioService.crearApartamento(condominio.id, payload);
    await refreshCondominio();
    return result;
  }, [condominio?.id, refreshCondominio]);

  const crearResidente = useCallback(async (apartamentoId, payload) => {
    const result = await condominioService.crearResidente(apartamentoId, payload);
    await refreshCondominio();
    return result;
  }, [refreshCondominio]);

  const setCondominioActivo = useCallback(async (condominioId) => {
    const nextId = condominioId ? String(condominioId) : "";
    persistActiveCondominioId(nextId);
    const current = condominios.find((item) => String(item.id) === nextId) || null;
    setCondominio(current);
    if (current?.id) {
      setLoading(true);
      try {
        await Promise.all([
          fetchEdificios(current.id),
          fetchApartamentos(current.id),
          fetchResidentes(current.id),
        ]);
      } finally {
        setLoading(false);
      }
    } else {
      setEdificios([]);
      setApartamentos([]);
      setResidentes([]);
    }
  }, [condominios, fetchApartamentos, fetchEdificios, fetchResidentes, persistActiveCondominioId]);

  return (
    <CondominioContext.Provider value={{
      condominios,
      condominio,
      activeCondominioId,
      edificios,
      apartamentos,
      residentes,
      loading,
      hasCondominio: Boolean(condominio),
      refreshCondominio,
      setCondominioActivo,
      crearCondominio,
      actualizarCondominio,
      crearEdificio,
      crearApartamento,
      crearResidente,
    }}>
      {children}
    </CondominioContext.Provider>
  );
}

export function useCondominio() {
  const ctx = useContext(CondominioContext);
  if (!ctx) {
    throw new Error("useCondominio debe usarse dentro de <CondominioProvider>");
  }
  return ctx;
}
