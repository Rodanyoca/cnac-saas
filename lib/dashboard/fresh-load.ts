export async function loadFreshDashboardSections<const T extends readonly unknown[]>(input: {
  loaders: { readonly [K in keyof T]: () => Promise<T[K]> }
}): Promise<{ [K in keyof T]: PromiseSettledResult<T[K]> }> {
  return Promise.allSettled(input.loaders.map((load) => load())) as Promise<{ [K in keyof T]: PromiseSettledResult<T[K]> }>
}
