import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"
const Soupport = (props) => (
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
      d="M14.567 25.894v-2.433c0-.808.633-1.533 1.533-1.533.808 0 1.533.633 1.533 1.533v2.342c0 1.625-1.35 2.975-2.975 2.975s-2.975-1.359-2.975-2.975v-5.134c-.091-4.683 3.609-8.475 8.292-8.475s8.375 3.792 8.375 8.384v5.133c0 1.625-1.35 2.975-2.975 2.975s-2.975-1.35-2.975-2.975v-2.342c0-.808.633-1.533 1.533-1.533.809 0 1.534.633 1.534 1.533v2.525"
    />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M22.942 18.086h-.675a.509.509 0 0 0-.442.267l-.625 1.25a.246.246 0 0 1-.442 0l-1.533-3.058c-.092-.175-.342-.184-.433-.009l-.7 1.292a.488.488 0 0 1-.434.258h-.608"
    />
  </Svg>
)
export default Soupport
