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
        <g className="portal-chat__robot-body">
          <path d="M41 86h18l-4 10q-5 10-10 0Z" fill={fill('thruster')} />
          {!profile && (
            <>
              <path className="portal-chat__robot-arm" d="M34 66q-9-5-16 10-4 8 1 9 7 0 17-12Z" fill={fill('red')} />
              <path d="M66 66q9-5 16 10 4 8-1 9-7 0-17-12Z" fill={fill('red')} />
            </>
          )}
          <path d="M32 70c0-8 8-12 18-12s18 4 18 12c0 13-8 22-18 22s-18-9-18-22Z" fill={fill('shell')} />
          {profile && (
            <path
              d="M49 65c4 2 5 6 3 9-3 5-9 9-15 10-4 1-6-2-4-5 2-4 6-10 10-13 2-2 4-2 6-1Z"
              fill={fill('red')}
            />
          )}
          {!profile && (
            <>
              <circle cx="50" cy="76" r="9.5" fill="#fff8f1" fillOpacity=".9" />
              <svg x="43.5" y="69.5" width="13" height="13" viewBox="0 0 303 280" aria-hidden="true">
                <image href={`${import.meta.env.BASE_URL}images/portal-robot-mark.png`} width="303" height="280" clipPath={fill('badge')} />
              </svg>
            </>
          )}
        </g>

        <g className="portal-chat__robot-head">
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
              <path
                className="portal-chat__robot-eye"
                d="M75.1 35.7C77.5 34.9 79.4 36.8 79 39.8C78.6 42.5 77 44.6 75 44.7C72.9 44.8 72.4 42.8 72.8 40.3C73.2 38 74 36.3 75.1 35.7Z"
                fill="#ffe2b9"
              />
            </g>
            <path className="portal-chat__robot-mouth portal-chat__robot-mouth--smile portal-chat__robot-mouth--profile-smile" d="M74 48.3Q80.4 49.8 86.1 46.9C84.6 52.1 78.6 54.2 74 48.3Z" />
            <path className="portal-chat__robot-mouth portal-chat__robot-mouth--thinking" d="M76 49.9Q79.5 50.6 83.3 48.8" />
            <path className="portal-chat__robot-mouth portal-chat__robot-mouth--concerned" d="M75.5 51.8Q79 47.7 82.9 50" />
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
      </g>
    </svg>
  )
}
