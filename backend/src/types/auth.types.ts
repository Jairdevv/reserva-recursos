export interface JwtPayload {
  id: number;
  rol: "usuario" | "admin";
  version_sesion: number;
}
