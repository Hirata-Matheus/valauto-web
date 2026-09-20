/** Layout das telas de conta: card centrado e estreito. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-token-2xl">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
