
export const RadioGroup = ({
  options = [], // Default empty array to prevent runtime crash
  name,
  value,
  onChange,
  renderLabel,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {options.map((option) => {
        const checked = value === option.id || value === option.value;

        return (
          <label
            key={option.id}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            {/* RADIO */}
            <span className="relative w-4 h-4 rounded-full border border-black flex items-center justify-center shrink-0">
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={checked}
                onChange={() => onChange(option.id)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {checked && (
                <span
                  aria-hidden="true"
                  className="absolute w-2 h-2 rounded-full bg-black"
                />
              )}
            </span>

            {/* LABEL */}
            <span
              className={option.labelClassName}
              dir={option.direction}
              lang={option.lang}
            >
              {renderLabel ? renderLabel(option) : option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
};