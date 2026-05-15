export default function LogoVotta({ alturaIcone = 28, classeTexto = 'text-lg font-bold', semTexto = false, className = '' }) {
  const largura = Math.round(alturaIcone * 100 / 90)
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={largura}
        height={alturaIcone}
        viewBox="0 0 100 90"
        fill="none"
        aria-hidden="true"
      >
        <polygon points="0,0 33,0 50,90 17,90" fill="#b83b3d" />
        <polygon points="67,0 100,0 83,90 50,90" fill="#b83b3d" />
      </svg>
      {!semTexto && (
        <span className={`font-display ${classeTexto}`} style={{ color: '#b83b3d' }}>
          Votta
        </span>
      )}
    </div>
  )
}
