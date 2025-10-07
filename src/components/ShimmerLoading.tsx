export const ShimmerLoading = () => {
  return (
    <div className="space-y-3 animate-[shimmer-fade-out_0.3s_ease-out_forwards]">
      <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-3/4 animate-shimmer"></div>
      <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-full animate-shimmer"></div>
      <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-5/6 animate-shimmer"></div>
    </div>
  );
};
