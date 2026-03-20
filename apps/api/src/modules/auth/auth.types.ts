export interface RegisterDto {
  firmName: string;
  firmSlug: string;
  firmEmail: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginDto {
  firmSlug: string;
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    firmId: string;
    firmName: string;
  };
}

export interface JwtPayload {
  userId: string;
  firmId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface ResetTokenPayload {
  userId: string;
  type: 'password_reset';
  iat: number;
  exp: number;
}

export interface CreateFirmWithOwnerData {
  firm: {
    name: string;
    slug: string;
    email: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  };
  ownerRoleId: string;
}
