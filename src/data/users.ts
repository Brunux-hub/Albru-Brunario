// Lista simulada de usuarios para autenticación
// Seguir buenas prácticas: no exponer contraseñas reales en producción

export type UserRole = 'admin' | 'gtr' | 'supervisor' | 'asesor' | 'calidad';

export interface User {
  username: string;
  password: string;
  role: UserRole;
}

export const users: User[] = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'gtr1', password: 'gtr123', role: 'gtr' },
  { username: 'supervisor1', password: 'supervisor123', role: 'supervisor' },
  { username: 'asesor1', password: 'asesor123', role: 'asesor' },
  { username: 'calidad1', password: 'calidad123', role: 'calidad' },
];
