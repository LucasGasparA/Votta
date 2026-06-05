import logoSrc from '../assets/logo.png'

const Logo = ({ size = 32, withText = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoSrc}
        alt="Votta"
        style={{ height: size, width: 'auto' }}
        draggable={false}
      />
      {withText && (
        <span
          className="font-display font-bold tracking-tight text-primary-600"
          style={{ fontSize: size * 0.6 }}
        >
          Votta
        </span>
      )}
    </div>
  )
}

export default Logo
