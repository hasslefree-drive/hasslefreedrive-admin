declare module 'helmet' {
  import { IncomingMessage, ServerResponse } from 'http';

  export interface HelmetOptions {
    contentSecurityPolicy?: any;
    crossOriginEmbedderPolicy?: any;
    crossOriginOpenerPolicy?: any;
    crossOriginResourcePolicy?: any;
    originAgentCluster?: boolean;
    referrerPolicy?: any;
    strictTransportSecurity?: any;
    xContentTypeOptions?: boolean;
    xDnsPrefetchControl?: any;
    xDownloadOptions?: boolean;
    xFrameOptions?: any;
    xPermittedCrossDomainPolicies?: any;
    xPoweredBy?: boolean;
    xXssProtection?: boolean;
  }

  export interface Helmet {
    (options?: Readonly<HelmetOptions>): (
      req: IncomingMessage,
      res: ServerResponse,
      next: (err?: unknown) => void
    ) => void;
    contentSecurityPolicy?: any;
    crossOriginEmbedderPolicy?: any;
    crossOriginOpenerPolicy?: any;
    crossOriginResourcePolicy?: any;
    originAgentCluster?: any;
    referrerPolicy?: any;
    strictTransportSecurity?: any;
    xContentTypeOptions?: any;
    xDnsPrefetchControl?: any;
    xDownloadOptions?: any;
    xFrameOptions?: any;
    xPermittedCrossDomainPolicies?: any;
    xPoweredBy?: any;
    xXssProtection?: any;
  }

  const helmet: Helmet;
  export default helmet;
}
