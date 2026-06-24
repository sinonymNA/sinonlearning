interface DocPageProps {
  children: React.ReactNode;
}

export default function DocPage({ children }: DocPageProps) {
  return (
    <div className="mx-auto w-full max-w-[680px] rounded-sm border border-navy-900/8 bg-white px-10 py-14 shadow-[0_4px_28px_rgba(13,27,46,0.08)] sm:px-16 sm:py-16">
      {children}
    </div>
  );
}
