import * as React from "react"
import Svg, { Path } from "react-native-svg"
const Mobile = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    fill="none"
    {...props}
  >
    <Path
      fill="#fff"
      d="M24 48c13.255 0 24-10.745 24-24S37.255 0 24 0 0 10.745 0 24s10.745 24 24 24Z"
    />
    <Path
      fill="#FC0"
      d="M28.24 14h-8.48C17 14 16 15 16 17.81v12.38C16 33 17 34 19.76 34h8.47C31 34 32 33 32 30.19V17.81C32 15 31 14 28.24 14ZM24 31.3c-.96 0-1.75-.79-1.75-1.75s.79-1.75 1.75-1.75 1.75.79 1.75 1.75-.79 1.75-1.75 1.75Zm2-13.05h-4c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h4c.41 0 .75.34.75.75s-.34.75-.75.75Z"
    />
  </Svg>
)
export default Mobile
