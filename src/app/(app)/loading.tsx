export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="bg-muted h-8 w-40 animate-pulse rounded-md" />
      <div className="bg-muted/60 h-64 w-full animate-pulse rounded-md" />
    </div>
  );
}
