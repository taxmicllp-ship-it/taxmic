export function getErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong';
  const err = error as any;
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong'
  );
}
