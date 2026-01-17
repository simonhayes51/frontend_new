export function GradientButton({ children, className = "", size = "default", variant = "default", ...props }) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    default: "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90",
    ghost: "bg-transparent border border-primary/20 text-primary hover:bg-primary/10",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
