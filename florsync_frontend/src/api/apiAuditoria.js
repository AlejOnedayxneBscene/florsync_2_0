import api from "./axios";

export const obtenerAuditoria = async () => {
  const res = await api.get("/auditoria/auditoria/");
  return res.data;
};
