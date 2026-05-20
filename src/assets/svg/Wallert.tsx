import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"
const Wallert = (props) => (
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
      d="M20.833 19.778h-5M11.667 19.777v-3.85c0-1.7 1.375-3.075 3.075-3.075h4.683c1.7 0 3.075 1.059 3.075 2.759"
    />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M24.567 20.653a1.678 1.678 0 0 0-.45 1.65c.208.775.975 1.267 1.775 1.267h.775v1.208a3.332 3.332 0 0 1-3.334 3.333H15a3.332 3.332 0 0 1-3.333-3.333v-5.833A3.332 3.332 0 0 1 15 15.61h8.333c1.834 0 3.334 1.5 3.334 3.334v1.208h-.9a1.66 1.66 0 0 0-1.2.5Z"
    />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M28.333 21.003v1.717c0 .467-.383.85-.858.85h-1.608c-.9 0-1.725-.658-1.8-1.558-.05-.525.15-1.017.5-1.359a1.66 1.66 0 0 1 1.2-.5h1.708c.475 0 .858.384.858.85Z"
    />
  </Svg>
)
export default Wallert
