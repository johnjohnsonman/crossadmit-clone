export default function RedditSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="font-sans"
      style={{
        fontFamily:
          'Inter, "IBM Plex Sans", system-ui, -apple-system, sans-serif',
      }}
    >
      {children}
    </div>
  );
}
