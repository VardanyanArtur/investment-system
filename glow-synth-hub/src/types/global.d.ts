interface Window {
  Telegram?: {
    WebApp?: {
      initData: string;
      initDataUnsafe?: {
        hash?: string;
        user?: {
          id: number;
          first_name: string;
          last_name?: string;
          username?: string;
          language_code?: string;
        };
      };
      // You can add other Telegram WebApp methods/properties if needed
      onEvent?: (event: string, callback: Function) => void;
      sendData?: (data: string) => void;
    };
  };
}
