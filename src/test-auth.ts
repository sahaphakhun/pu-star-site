import { verifyToken } from './lib/auth';

// Test the verifyToken function
type MockRequest = {
  headers: {
    get: (name: string) => string | null;
  };
  cookies?: {
    get: (name: string) => { value: string } | undefined;
  };
};

// Mock request with no token
const mockRequestNoToken: MockRequest = {
  headers: {
    get: (_name: string) => null,
  },
  cookies: {
    get: (_name: string) => undefined,
  },
};

console.log('Testing verifyToken with no token:');
verifyToken(mockRequestNoToken).then(result => {
  console.log('Result:', result);
  console.log('Is null?', result === null);
  console.log('Has valid property?', result && typeof result === 'object' && 'valid' in result);
  console.log('Has userId property?', result && typeof result === 'object' && 'userId' in result);
});
