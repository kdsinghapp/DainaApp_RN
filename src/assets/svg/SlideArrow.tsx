import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SlideArrow = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      stroke="#FC0"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={2}
      d="M14.43 5.93 20.5 12l-6.07 6.07M3.5 12h16.83"
    />
  </Svg>
)
export default SlideArrow
