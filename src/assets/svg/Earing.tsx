import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"
const Earing = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={41}
    fill="none"
    {...props}
  >
    <Circle cx={20} cy={20.486} r={20} fill="#FC0" />
    <Path
      stroke="#fff"
      strokeWidth={1.5}
      d="M10.07 13.086c.8-3.46 6.01-3.46 6.8 0 .47 2.03-.82 3.75-1.94 4.82-.82.78-2.11.77-2.93 0-1.11-1.07-2.4-2.79-1.93-4.82ZM23.07 25.086c.8-3.46 6.04-3.46 6.84 0 .47 2.03-.82 3.75-1.95 4.82-.82.78-2.12.77-2.94 0-1.13-1.07-2.42-2.79-1.95-4.82Z"
    />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13.486h2.68c1.85 0 2.71 2.29 1.32 3.51l-7.99 6.99c-1.39 1.21-.53 3.5 1.31 3.5H20"
    />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.486 13.986h.012M26.486 25.986h.012"
    />
  </Svg>
)
export default Earing
