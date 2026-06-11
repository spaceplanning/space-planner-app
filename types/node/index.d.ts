declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }

  const process: {
    env: NodeJS.ProcessEnv;
  };
}

export {};
