'use client'
import styles from './page.module.css'

import Image from 'next/image'

// <Setup Blueprint>
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import { FocusStyleManager } from '@blueprintjs/core'
FocusStyleManager.onlyShowFocusOnTabs()

import { TopBar } from '@/components'

function CenteredSection(props) {
  const { maxWidth, children } = props
  return (
    <section
      style={{
        maxWidth: maxWidth ? maxWidth : '65rem',
        margin: '0 auto',
      }}
    >
      {children}
    </section>
  )
}

export default function Home() {
  return (
    <main>
      <TopBar selectedTabId="HOME" />
      <CenteredSection>
        <div style={{ display: 'flex', height: '20rem' }}>
          <div
            style={{
              width: '35%',
              textWrap: 'balance',
              display: 'grid',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                alignSelf: 'center',
              }}
            >
              <h1>Resolve your LA County criminal case, afforably and efficiently.</h1>
              <br></br>
              <h3>
                We provide legal services, powered by modern technology. Proudly serving Los Angeles County since 2016.
              </h3>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
            }}
          >
            <div
              style={{
                alignSelf: 'center',
                display: 'flex',
                gap: '1rem',
              }}
            >
              <div>
                <Image priority height={220} width={220} src={'/joshua_wade.jpg'} />
                <p>Joshua Wade, Attorney</p>
              </div>
              <div>
                <Image priority height={220} width={220} src={'/shane_wade.jpg'} />
                <p>Shane Wade, Software Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </CenteredSection>
      <CenteredSection maxWidth={'30rem'}>
        <h1>Criminal Cases We Take</h1>
        <br />
        <div
          style={{
            display: 'flex',
            gap: '2rem',
          }}
        >
          <ul>
            <li>DUI Defense</li>
            <li>Possession of Drugs</li>
            <li>Possession of a Weapon</li>
            <li>Domestic Violence</li>
          </ul>
          <ul>
            <li>Clearing Criminal Record</li>
            <li>Sex Crimes</li>
            <li>And Other Criminal Criminal Cases</li>
          </ul>
        </div>
      </CenteredSection>
      <br />
      <br />
      <CenteredSection maxWidth={'30rem'}>
        <h1>Call, Text, or Email for a Free Consultation</h1>
        <br />
        <h3>Joshua.c.wade@gmail.com | 818-823-7705</h3>
      </CenteredSection>
      <CenteredSection>
        <h1>About Us</h1>
      </CenteredSection>
    </main>
  )
}
