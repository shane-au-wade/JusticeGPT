'use client'
import styles from './page.module.css'

import Image from 'next/image'

// <Setup Blueprint>
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import { AnchorButton, Button, FocusStyleManager } from '@blueprintjs/core'
FocusStyleManager.onlyShowFocusOnTabs()

import { TopBar } from '@/components'

import LinkedIcon from 'remixicon/icons/Logos/linkedin-box-fill.svg'

function CenteredSection(props) {
  const { maxWidth, column, children, style } = props
  return (
    <section
      style={{
        maxWidth: maxWidth ? maxWidth : '65rem',
        margin: '0 auto',
        display: 'flex',
        flexDirection: !!column ? 'column' : 'row',
        padding: '0.75rem',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

export default function Home() {
  return (
    <main className="dotted">
      <TopBar selectedTabId="HOME" />
      <CenteredSection style={{ minHeight: '20rem', flexWrap: 'wrap', gap: '2rem', marginTop: '2rem' }}>
        <div
          className={styles.heroText}
          style={{
            textWrap: 'balance',
            margin: 'auto',
          }}
        >
          <h1
            style={{
              fontSize: '1.75rem',
            }}
          >
            Resolve your LA County criminal case, afforably and efficiently.
          </h1>
          <br></br>
          <h3 style={{ fontSize: '1.2rem' }}>
            We provide legal services, powered by modern technology. Proudly serving Los Angeles County since 2016.
          </h3>
        </div>
        <div
          style={{
            margin: 'auto',
            display: 'flex',
            padding: '1rem 1rem 1rem 0',
          }}
        >
          <div
            style={{
              margin: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ margin: 'auto' }}>
              <Image priority height={220} width={220} src={'/joshua_wade.jpg'} />
              <p>
                Joshua Wade,
                <br /> Attorney
              </p>
            </div>
            <div style={{ margin: 'auto' }}>
              <Image priority height={220} width={220} src={'/shane_wade.jpg'} />
              <p>
                Shane Wade,
                <br /> Software Engineer
              </p>
            </div>
          </div>
        </div>
      </CenteredSection>
      <CenteredSection
        style={{
          height: '18rem',
        }}
      >
        <div
          style={{
            margin: 'auto',
            width: '35rem',
          }}
        >
          <h1>Criminal Cases We Take</h1>
          <br />
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              fontSize: '1.1rem',
            }}
          >
            <ul style={{ marginLeft: '1rem' }}>
              <li>Assest Forfeiture</li>
              <li>Traffic Tickets</li>
              <li>DUI Defense</li>
              <li>Domestic Violence</li>
            </ul>
            <ul>
              <li>Clearing Criminal Record</li>
              <li>Possession of Drugs</li>
              <li>Possession of a Weapon</li>

              <li>And Other Criminal Cases</li>
            </ul>
          </div>
        </div>
      </CenteredSection>
      <CenteredSection style={{ minHeight: '15rem' }}>
        <div
          style={{
            margin: 'auto',
            width: '35rem',
            outline: '2px solid black',
            textWrap: 'balance',
            padding: '1rem',
            borderRadius: '7px',
            background: '#fff',
          }}
        >
          <h1>
            Call, Text, or Email for a <u>Free Consultation</u>
          </h1>
          <br />
          <h3>Joshua.c.wade@gmail.com | 818-823-7705</h3>
          <br />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <AnchorButton
              href="tel:+1818-823-7705"
              // large
              text="Call"
              icon="phone-call"
              style={{ borderRadius: '7px' }}
            />
            <AnchorButton
              href="sms:+1818-823-7705"
              // large
              text="Text"
              icon="mobile-phone"
              style={{ borderRadius: '7px' }}
            />
            <AnchorButton
              href="mailto:joshua.c.wade@gmail.com"
              // large
              text="Email"
              icon="envelope"
              style={{ borderRadius: '7px' }}
            />
          </div>
        </div>
      </CenteredSection>
      <br />
      <br />
      <br />
      <CenteredSection
        style={{
          minHeight: '30rem',
        }}
      >
        <div
          style={{
            margin: 'auto',
          }}
        >
          <h1>About Us</h1>
          <hr
            style={{
              // marginTop: '0.1rem',
              marginBottom: '1rem',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              textWrap: 'balance',
            }}
          >
            <div
              style={{
                maxWidth: '24rem',
              }}
            >
              <h2
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                }}
              >
                Joshua Wade{' '}
                <a href="https://www.linkedin.com/in/joshuawadepatent/" target="_blank">
                  <img style={{ marginLeft: '0.5rem' }} height="24" width="24" src={LinkedIcon.src} />
                </a>
                <a href="https://apps.calbar.ca.gov/attorney/Licensee/Detail/310028" target="_blank">
                  <span style={{ fontSize: '1rem' }}>Bar No. 310028</span>
                </a>
              </h2>
              <br />
              <p>
                Joshua has been serving the Los Angeles County area since 2016. He was born and raised in Glendale, CA
                and graduated from Loyola Law School.
              </p>
              <p>
                Over his 8 years of service, Joshua has worked thousands of traffic cases, many cases were resolved with
                a dismissal and other saw a reduction in the fine. He has also worked thousands of misdemeanor and
                felony cases.
              </p>
              <p>
                Joshua Wade is an experienced criminal defense attorney who is trusted by thousands of residents in Los
                Angeles.
              </p>
            </div>
            <div
              style={{
                maxWidth: '24rem',
              }}
            >
              <h2 style={{ display: 'flex', gap: '0.5rem' }}>
                Shane Wade{' '}
                <a href="https://www.linkedin.com/in/shane-au-wade/" target="_blank">
                  <img style={{ marginLeft: '0.5rem' }} height="24" width="24" src={LinkedIcon.src} />
                </a>
                <a href="https://www.shanewade.dev" target="_blank">
                  <span style={{ fontSize: '1rem' }}>shanewade.dev</span>
                </a>
              </h2>
              <br />
              <p>
                Shane is a results-oriented software engineer with 4+ years of experience in developing and implementing
                high-quality software solutions.
              </p>
              <p>
                He is adaptable and self-motivated, with a strong track record of delivering projects on time and
                exceeding expectations.
              </p>
              <p>
                Shane aims to help the Los Angeles community by building software to enable efficient and affordable
                interactions between Attorneys, Clients, and the Justice System.
              </p>
            </div>
          </div>
        </div>
      </CenteredSection>
      <CenteredSection style={{ minHeight: '10rem' }}>
        <div
          style={{
            margin: 'auto',
            display: 'flex',
            gap: '1rem',
          }}
        >
          <a href="/">Home</a>
          <a href="/caseSearch">Case Search</a>
        </div>
      </CenteredSection>
    </main>
  )
}
