import * as React from "react"
import Svg, { Path } from "react-native-svg"
const User = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={25}
    height={25}
    fill="none"
    {...props}
  >
    <Path
      stroke="#2F4858"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12.5 12.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM21.09 22.5c0-3.87-3.85-7-8.59-7s-8.59 3.13-8.59 7"
    />
  </Svg>
)
export default User
