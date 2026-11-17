import { useId } from 'react'

export default function PortalChatRobot({ profile = false }) {
  const id = useId()
  const fill = name => `url(#${id}-${name})`

  return (
    <svg className="portal-chat__robot-art" viewBox="0 0 100 112" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-shell`} cx=".27" cy=".18" r=".9">
          <stop stopColor="#fffdf4" />
          <stop offset=".42" stopColor="#ffe8d6" />
          <stop offset=".75" stopColor="#e8a4a0" />
          <stop offset="1" stopColor="#9e4a58" />
        </radialGradient>
        <linearGradient id={`${id}-red`} x2="1" y2="1">
          <stop stopColor="#ff9b90" />
          <stop offset=".4" stopColor="#ce3342" />
          <stop offset="1" stopColor="#6c1025" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x2=".2" y2="1">
          <stop stopColor="#21151d" />
          <stop offset=".62" stopColor="#39232e" />
          <stop offset="1" stopColor="#753345" />
        </linearGradient>
        <radialGradient id={`${id}-thruster`} cx=".42" cy=".33" r=".67">
          <stop stopColor="#fff3d4" />
          <stop offset=".38" stopColor="#ffb99d" />
          <stop offset="1" stopColor="#ce3342" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-badge`}>
          <path d="M0 0h303v108h-8v57h8v115H0z" />
        </clipPath>
      </defs>

      <ellipse className="portal-chat__robot-shadow" cx="50" cy="105" rx="25" ry="3.5" fill="#3d1528" />
      <g className="portal-chat__robot-float">
        <path d="M41 86h18l-4 10q-5 10-10 0Z" fill={fill('thruster')} />
        <path d="M34 66q-9-5-16 10-4 8 1 9 7 0 17-12Z" fill={fill('red')} />
        {!profile && (
          <path className="portal-chat__robot-arm" d="M66 66q9-5 16 10 4 8-1 9-7 0-17-12Z" fill={fill('red')} />
        )}
        <path d="M32 70c0-8 8-12 18-12s18 4 18 12c0 13-8 22-18 22s-18-9-18-22Z" fill={fill('shell')} />
        <circle cx={profile ? 55 : 50} cy="76" r="9.5" fill="#fff8f1" fillOpacity=".9" />
        <svg x={profile ? 48.5 : 43.5} y="69.5" width="13" height="13" viewBox="0 0 303 280" aria-hidden="true">
          <image href={`${import.meta.env.BASE_URL}images/portal-robot-mark.png`} width="303" height="280" clipPath={fill('badge')} />
        </svg>

        {profile ? (
          <>
            <path d="M52 15l3-10" stroke="#db4b57" strokeWidth="3" strokeLinecap="round" />
            <circle cx="55" cy="5" r="3" fill="#ff9a83" />
            <path d="M13 42c0-16 15-30 36-30 20 0 38 12 40 30 2 16-11 22-37 22S13 56 13 42Z" fill={fill('shell')} />
            <path d="M88 37c-8-9-20-11-29-4-5 4-8 11-7 17 0 6 8 9 18 9 13 0 21-4 20-14Z" fill={fill('glass')} />
            <circle cx="31" cy="40" r="8" fill={fill('red')} />
            <circle cx="30" cy="39" r="4" fill="#ffbcaa" />
            <path d="M34 47q7 11 29 9" fill="none" stroke="#db4655" strokeWidth="3" strokeLinecap="round" />
            <rect x="60" y="53" width="8" height="5" rx="2.5" fill="#fd9382" />
            <g className="portal-chat__robot-gaze">
              <ellipse className="portal-chat__robot-eye" cx="72" cy="41" rx="3.2" ry="5" fill="#ffe2b9" />
            </g>
            <path className="portal-chat__robot-mouth portal-chat__robot-mouth--smile" d="M73 48q4.5 4 9 0" />
            <path className="portal-chat__robot-mouth portal-chat__robot-mouth--thinking" d="M74 50h6" />
            <path className="portal-chat__robot-mouth portal-chat__robot-mouth--concerned" d="M73 51q4.5-4 9 0" />
          </>
        ) : (
          <>
            <path d="M68 18l8-13" stroke="#db4b57" strokeWidth="3" strokeLinecap="round" />
            <circle cx="77" cy="5" r="3.3" fill="#ff9a83" />
            <ellipse cx="15" cy="42" rx="7" ry="8" fill={fill('red')} />
            <ellipse cx="85" cy="42" rx="7" ry="8" fill={fill('red')} />
            <path d="M13 45c0-17 15-33 37-33s37 16 37 33c0 14-14 20-37 20S13 59 13 45Z" fill={fill('shell')} />
            <path d="M25 45c0-12 11-22 25-22s25 10 25 22c0 10-9 13-25 13s-25-3-25-13Z" fill={fill('glass')} />
            <path d="M33 32q9-7 20-6" fill="none" stroke="#fff2e1" strokeOpacity=".28" strokeWidth="1.4" strokeLinecap="round" />
            <g className="portal-chat__robot-gaze" fill="#ffe2b9">
              <ellipse className="portal-chat__robot-eye" cx="39" cy="40" rx="3.5" ry="5.5" />
              <ellipse className="portal-chat__robot-eye" cx="61" cy="40" rx="3.5" ry="5.5" />
            </g>
            <path className="portal-chat__robot-mouth portal-chat__robot-mouth--smile" d="M45 49q5 4 10 0" />
            <path className="portal-chat__robot-mouth portal-chat__robot-mouth--grin" d="M43 48h14q-7 12-14 0Z" />
            <path d="M83 44q-1 11-17 12" fill="none" stroke="#c33245" strokeWidth="3" strokeLinecap="round" />
            <rect x="62" y="53.5" width="9" height="5" rx="2.5" fill="#ff9a83" />
          </>
        )}
      </g>
    </svg>
  )
}
