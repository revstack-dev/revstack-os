import { RevstackError } from "@/types/errors";

export interface InstallInput {
  /**
   * La configuración ingresada por el usuario en el formulario (API Keys, etc).
   */
  config: Record<string, any>;

  /**
   * La URL absoluta donde Revstack espera recibir los eventos para este merchant.
   * El Core la genera: https://api.revstack.os/webhooks/{provider}/{merchantId}
   */
  webhookUrl: string;
}

export interface InstallResult {
  success: boolean;
  /**
   * Datos finales a guardar en la DB.
   * Aquí el provider puede inyectar datos generados (como el webhookSecret).
   */
  data?: Record<string, any>;
  error?: RevstackError;
}
