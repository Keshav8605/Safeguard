// Mock Vite environment variables for Jest
if (!('import' in globalThis)) {
	// @ts-expect-error
	globalThis.import = {};
}
if (!('meta' in globalThis.import)) {
	// @ts-expect-error
	globalThis.import.meta = { env: { VITE_GOOGLE_MAPS_KEY: '' } };
}
import '@testing-library/jest-dom';

import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
	// @ts-expect-error
	global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
	// @ts-expect-error
	global.TextDecoder = TextDecoder;
}
