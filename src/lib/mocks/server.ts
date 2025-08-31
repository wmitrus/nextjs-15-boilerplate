import { setupServer } from 'msw/node';

import { handlers } from './handlers';

// Use node version for integration tests
export const server = setupServer(...handlers);
