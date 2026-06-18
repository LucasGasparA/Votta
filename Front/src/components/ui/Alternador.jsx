const Alternador = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-150
      ${checked ? 'bg-primary-600' : 'bg-primary-200 '}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400'}`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-150
        ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
    />
  </button>
)

export default Alternador
