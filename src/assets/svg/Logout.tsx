import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"
const Logout = (props) => (
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
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={1.5}
      d="m24.533 22.67 2.134-2.133-2.134-2.134M18.133 20.536h8.475M19.8 27.153c-3.683 0-6.667-2.5-6.667-6.667s2.984-6.667 6.667-6.667"
    />
  </Svg>
)
export default Logout
