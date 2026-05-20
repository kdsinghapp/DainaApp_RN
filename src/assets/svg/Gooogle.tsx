import * as React from "react"
import Svg, { G, Path, Defs } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: filter */
const Gooogle = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={88}
    height={88}
    fill="none"
    {...props}
  >
    <G filter="url(#a)">
      <Path
        fill="#fff"
        d="M44 65c13.255 0 24-10.745 24-24S57.255 17 44 17 20 27.745 20 41s10.745 24 24 24Z"
      />
    </G>
    <Path
      fill="#4285F4"
      d="M54 41.135a8.824 8.824 0 0 0-.217-2.105h-9.669v3.822h5.675a5.03 5.03 0 0 1-2.105 3.341l-.019.128 3.057 2.368.212.021A10.07 10.07 0 0 0 54 41.135Z"
    />
    <Path
      fill="#34A853"
      d="M44.297 51.204a9.815 9.815 0 0 0 6.819-2.494l-3.25-2.517a6.1 6.1 0 0 1-3.57 1.03 6.2 6.2 0 0 1-5.858-4.279l-.121.01-3.18 2.46-.041.116a10.29 10.29 0 0 0 9.2 5.675"
    />
    <Path
      fill="#FBBC05"
      d="M38.439 43.037a6.338 6.338 0 0 1-.339-2.036 6.66 6.66 0 0 1 .332-2.037l-.006-.136-3.226-2.5-.105.05a10.276 10.276 0 0 0 0 9.245l3.341-2.586"
    />
    <Path
      fill="#EB4335"
      d="M44.192 34.778a5.61 5.61 0 0 1 3.936 1.533L51 33.473a9.72 9.72 0 0 0-6.81-2.677 10.163 10.163 0 0 0-9.093 5.675l3.292 2.586a6.161 6.161 0 0 1 5.8-4.279"
    />
    <Defs></Defs>
  </Svg>
)
export default Gooogle
