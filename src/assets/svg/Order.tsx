import * as React from "react"
import Svg, { Path } from "react-native-svg"
const Order = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={25}
    height={25}
    fill="none"
    {...props}
  >
    <Path
      stroke="#2F4858"
      strokeWidth={1.5}
      d="M2.77 5.1c.8-3.46 6.01-3.46 6.8 0 .47 2.03-.82 3.75-1.94 4.82-.82.78-2.11.77-2.93 0C3.59 8.85 2.3 7.13 2.77 5.1ZM15.77 17.1c.8-3.46 6.04-3.46 6.84 0 .47 2.03-.82 3.75-1.95 4.82-.82.78-2.12.77-2.94 0-1.13-1.07-2.42-2.79-1.95-4.82Z"
    />
    <Path
      stroke="#2F4858"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12.7 5.5h2.68c1.85 0 2.71 2.29 1.32 3.51L8.71 16c-1.39 1.21-.53 3.5 1.31 3.5h2.68"
    />
    <Path
      stroke="#2F4858"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6.186 6h.012M19.186 18h.012"
    />
  </Svg>
)
export default Order
