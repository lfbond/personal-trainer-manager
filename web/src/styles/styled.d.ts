import 'styled-components'

import type { defaultTheme } from './themes/default'

declare module 'styled-components' {
  export interface DefaultTheme {
    white: typeof defaultTheme.white

    gray: typeof defaultTheme.gray

    green: typeof defaultTheme.green

    red: typeof defaultTheme.red
  }
}