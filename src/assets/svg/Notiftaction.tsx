import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"
const Notiftaction = (props) => (
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
    strokeMiterlimit={10}
    strokeWidth={1.5}
    d="M20 15.852v2.776M20.017 12.153a5.548 5.548 0 0 0-5.55 5.55v1.75c0 .567-.234 1.417-.525 1.9l-1.059 1.767c-.65 1.092-.2 2.308 1 2.708a19.45 19.45 0 0 0 12.275 0 1.85 1.85 0 0 0 1-2.708L26.1 21.353c-.292-.483-.525-1.341-.525-1.9v-1.75c-.008-3.05-2.508-5.55-5.558-5.55Z"
  />
  <Path
    stroke="#fff"
    strokeMiterlimit={10}
    strokeWidth={1.5}
    d="M22.775 26.17A2.785 2.785 0 0 1 20 28.945a2.78 2.78 0 0 1-1.958-.817c-.5-.5-.817-1.2-.817-1.958"
  />
</Svg>
)
export default Notiftaction
