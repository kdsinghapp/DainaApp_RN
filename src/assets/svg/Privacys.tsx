import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"
const Privacys = (props) => (
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
      strokeWidth={1.5}
      d="m18.742 12.345-4.159 1.567c-.958.358-1.741 1.491-1.741 2.508v6.192c0 .983.65 2.275 1.441 2.867l3.584 2.675c1.175.883 3.108.883 4.283 0l3.583-2.675c.792-.592 1.442-1.884 1.442-2.867V16.42c0-1.025-.783-2.158-1.742-2.517l-4.158-1.558c-.708-.258-1.842-.258-2.533 0Z"
    />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m17.542 20.378 1.341 1.342 3.584-3.583"
    />
  </Svg>
)
export default Privacys
