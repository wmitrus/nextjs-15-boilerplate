async function initMocks() {
  const isNode = typeof window === 'undefined';
  const isTest = process.env.NODE_ENV === 'test';

  if (isNode) {
    const { server } = await import('./server');
    server.listen({
      onUnhandledRequest: isTest ? 'warn' : 'bypass',
    });
  } else {
    const { worker } = await import('./browser');
    worker.start({
      onUnhandledRequest: isTest ? 'warn' : 'bypass',
      quiet: !isTest,
    });
  }
}

initMocks();

export {};
