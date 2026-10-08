import api from "../../shared/api/http";
import type { LoginResponse, RegistroResponse } from "../auth/types";

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return response.data;
};

export const registro = async (
  nombre: string,
  email: string,
  password: string,
): Promise<RegistroResponse> => {
  const response = await api.post<RegistroResponse>("/auth/registro", {
    email,
    nombre,
    password,
  });
  return response.data;
};
