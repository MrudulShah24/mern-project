const AuthInput = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  icon: Icon,
  autoComplete,
  disabled,
}) => {
  const hasIcon = Boolean(Icon);

  return (
    <div className="relative">
      {hasIcon && (
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-800/40 dark:text-white/50" />
      )}
      <input
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={onChange}
        placeholder=" "
        className={`peer w-full rounded-2xl border border-amber-500/20 bg-white/60 dark:bg-white/5 px-4 ${hasIcon ? "pl-11" : ""} py-3 text-sm text-gray-900 dark:text-white/90 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/30 ${disabled ? "opacity-70" : ""}`}
      />
      <label
        style={{ left: hasIcon ? "2.75rem" : "1rem" }}
        className="absolute top-2 text-[0.65rem] uppercase tracking-[0.2em] text-amber-900/60 dark:text-white/50 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-white/40 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[0.65rem] peer-focus:text-amber-600 dark:peer-focus:text-amber-200/90"
      >
        {label}
      </label>
    </div>
  );
};

export default AuthInput;
