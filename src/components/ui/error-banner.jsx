export default function ErrorBanner({ children }) {
  return (
    <p className="border-l-2 border-wine bg-wine/5 px-4 py-3 text-[13px] text-wine">
      {children}
    </p>
  );
}
