async function initMocks() {
  if (typeof window === 'undefined') {
    const { server } = await import('./server');
    server.listen({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    });
  } else {
    const { worker } = await import('./browser');
    worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
      quiet: true, // Reduce console output
    });
  }
}

initMocks();

export {};
