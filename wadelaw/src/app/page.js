'use client'
import styles from './page.module.css'

// <Setup Blueprint>
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import { FocusStyleManager } from '@blueprintjs/core'
FocusStyleManager.onlyShowFocusOnTabs()

import { AnchorButton } from '@blueprintjs/core'

export default function Home() {
  return (
    <main>
      <header
        style={{
          display: 'flex',
          padding: '1rem',
          gap: '1rem',
        }}
      >
        <h1 className={styles.logo}>Wade Law</h1>

        <AnchorButton minimal icon="search" text="Case Search" href="caseSearch" />
      </header>
    </main>
  )
}
