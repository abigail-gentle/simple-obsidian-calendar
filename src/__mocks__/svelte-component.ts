// Stub for .svelte file imports in unit tests.
// Components that need real rendering are tested via @testing-library/svelte
// (which processes the actual .svelte files through svelte-preprocess).
// All other tests that import a .svelte file get this no-op stub.

export default class SvelteComponentStub {
  constructor(_options: unknown) {}

  $destroy = jest.fn();
  $set = jest.fn();
  $on = jest.fn();
}
