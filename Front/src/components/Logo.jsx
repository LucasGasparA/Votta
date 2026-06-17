import vottaLogoUrl from '../assets/Votta-logo.svg'

const Logo = ({ size = 32, withText = false, className = '' }) => {
  const src = vottaLogoUrl
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={src}
        alt="Votta"
        style={{ height: size, width: 'auto' }}
        draggable={false}
      />
    </div>
  )
}

export default Logo
