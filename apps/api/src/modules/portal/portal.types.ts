export interface PortalLoginDto {
  firmSlug: string;
  email: string;
  password: string;
}

export interface CreatePortalAccountDto {
  clientId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PortalJwtPayload {
  clientUserId: string;
  clientId: string;
  firmId: string;
  email: string;
  type: 'portal';
  iat: number;
  exp: number;
}

export interface PortalAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    clientId: string;
    firmId: string;
  };
}

// Express namespace augmentation
declare global {
  namespace Express {
    interface Request {
      portalUser?: {
        clientUserId: string;
        clientId: string;
        firmId: string;
        email: string;
      };
    }
  }
}
