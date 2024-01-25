import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import styles from '@/components/index.module.css'

import React from 'react'

// <Setup Blueprint>
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'

import {
  Button,
  Tabs,
  Tab,
  Popover,
  Menu,
  MenuItem,
  InputGroup,
  TextArea,
  HTMLSelect,
  Card,
  Icon,
} from '@blueprintjs/core'

const PRIMARY = '#f2f2f2'
const SECONDARY = '#292933'
const ACCENT = '#72c1f2'

const LINKEDIN_URL = 'https://www.linkedin.com/company/thresholduav/about/'

const THRESHOLD_URL = 'https://www.thresholduav.com'

function OpenGraphTags(props) {
  const { title, description, domain, page } = props

  return (
    <>
      {/* <!-- Facebook Meta Tags --> */}
      <meta name="description" content={description} />
      <meta property="og:url" content={`https://${domain}${page}`} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" height={1200} width={630} content="/threshold/main_logo_1200x630.png" />

      {/* <!-- Twitter Meta Tags --> */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content={domain} />
      <meta property="twitter:url" content={`https://${domain}${page}`} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" height={1200} width={630} content="/threshold/main_logo_1200x630.png" />
    </>
  )
}

const DefaultHead = (props) => {
  const { children } = props
  return (
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/drone_icon-removebg.png" />

      {/* samsung internet browser, force light mode */}
      <meta name="color-scheme" content="light only" />

      {/* hotjar integration */}
      <script async>
        {`
        function initHotJar(h, o, t, j, a, r) {
          h.hj =
            h.hj ||
            function () {
              ;(h.hj.q = h.hj.q || []).push(arguments)
            }
          h._hjSettings = { hjid: 3734200, hjsv: 6 }
          a = o.getElementsByTagName('head')[0]
          r = o.createElement('script')
          r.async = 1
          r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv
          a.appendChild(r)
        }
        
        initHotJar(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=')
        `}
      </script>

      {children}
    </Head>
  )
}

const TopBar = (props) => {
  const { selectedTabId } = props

  const dialog_ref = React.useRef()

  const router = useRouter()

  return (
    <header>
      <dialog
        ref={dialog_ref}
        style={{
          width: '100%',
          margin: 'auto',
          borderRadius: '7px',
          padding: '1rem',
          border: '1px dashed black',
          maxWidth: '20rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <span>
            <h1>Contact Us</h1>
            <p
              style={{
                fontSize: '1rem',
                margin: '0',
              }}
            >{`We are here to help.`}</p>
          </span>

          <h3>joshua.c.wade@gmail.com</h3>
          <h3>
            <a href={'sms:818-823-7705'}>
              <Icon icon="phone-call" /> 818-823-7705
            </a>
          </h3>

          <h3>
            <a href="https://apps.calbar.ca.gov/attorney/Licensee/Detail/310028" target="_blank">
              Bar No. 310028
            </a>
          </h3>

          <Button
            icon="cross"
            text="Close"
            onClick={() => {
              dialog_ref.current.close()
            }}
          />
        </div>
      </dialog>
      <section
        id="header"
        style={{
          width: '100%',
          height: '6rem',
          position: 'fixed',
          padding: '0.5rem',
          paddingTop: '0',
          zIndex: '10',
        }}
      >
        <div
          style={{
            maxWidth: '70rem',
            display: 'flex',
            margin: '0 auto',
            height: '6rem',
            // outline: '1px red solid',
            borderRadius: '0px 0px 7px 7px',
            background: 'rgba(242,242,242, 0.50 )',
            WebkitBackdropFilter: 'blur(10px)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 30px rgba(41,41,51,.1)',
            zIndex: '2',
          }}
        >
          <div
            className="logo_container"
            style={{
              display: 'grid',
              height: '100%',
            }}
          >
            <h1
              style={{
                alignSelf: 'center',
                // height: '1.5rem',
                width: '8rem',
                textAlign: 'center',
                padding: '0.5rem 0.4rem 0.4rem 0.4rem',
                // width: '10rem',
                outline: '2px solid black',
                borderRadius: '7px',
              }}
            >
              Wade Law
            </h1>
          </div>
          <div id="spacer" style={{ width: '100%' }} />
          <div
            style={{
              display: 'grid',
              padding: '1rem',
            }}
          >
            <div id="header_buttons" style={{ alignSelf: 'center' }}>
              <div className={styles.mobile_menu}>
                <Popover
                  minimal
                  position="bottom-right"
                  content={
                    <Menu>
                      <MenuItem
                        text="Home Page"
                        large
                        onClickCapture={() => {
                          router.push('/')
                        }}
                      />
                      <MenuItem
                        text="Case Search"
                        large
                        onClickCapture={() => {
                          router.push('/caseSearch')
                        }}
                      />
                      <MenuItem
                        text="Contact Us"
                        large
                        onClickCapture={() => {
                          dialog_ref.current.showModal()
                        }}
                      />
                    </Menu>
                  }
                >
                  <Button
                    icon="menu"
                    intent="primary"
                    outlined
                    large
                    minimal
                    style={{
                      borderRadius: '7px',
                    }}
                  />
                </Popover>
              </div>
              <div className={styles.desktop_menu}>
                <Tabs large selectedTabId={selectedTabId ? selectedTabId : ''}>
                  <Tab
                    id="HOME"
                    title="Home"
                    onClickCapture={() => {
                      router.push('/')
                    }}
                  />
                  <Tab
                    id="CASE_SEARCH"
                    title="Case Search"
                    onClickCapture={() => {
                      router.push('/caseSearch')
                    }}
                  />
                  <Tab
                    id="CONTACT"
                    title="Contact"
                    onClickCapture={() => {
                      dialog_ref.current.showModal()
                    }}
                  />
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* spacer */}
      <div
        style={{
          height: '6.5rem',
        }}
      />
    </header>
  )
}

const ClosingSection = () => {
  return (
    <section
      style={{
        textAlign: 'center',
        height: '5rem',
      }}
    >
      <p
        style={{
          color: SECONDARY,
        }}
      >
        _______
      </p>
      <br></br>
      <div
        className="flex_row"
        style={{
          textAlign: 'left',
          margin: '0 auto',
          width: 'fit-content',
          gap: '3rem',
          flexWrap: 'wrap',
          padding: '1rem',
        }}
      >
        <div className="flex_column">
          <h4>Pages</h4>
          <a href={`${THRESHOLD_URL}/`}>Home</a>
          <a href={`${THRESHOLD_URL}/rockmap`}>Rock Map</a>
          <a href={`${THRESHOLD_URL}/about`}>About</a>
          <a href={`${THRESHOLD_URL}/blog`}>Blog</a>
          <br />
          <a href={`${THRESHOLD_URL}/sitemap.xml`}>Site Map</a>
        </div>
        <div className="flex_column">
          <h4>Documents</h4>
          <a href={`${THRESHOLD_URL}/pdfs/rock_mapping.pdf`}>rock_mapping.pdf</a>
          <a href={`${THRESHOLD_URL}/pdfs/rock_mapping_details.pdf `}>rock_mapping_details.pdf</a>
        </div>

        <div className="flex_column">
          <h4>Contact Us</h4>
          <a href={LINKEDIN_URL} target="_blank">
            <Icon icon="link" /> linkedin.com/thresholduav
          </a>
          <div>
            <Icon icon="envelope" /> mac@thresholduav.com
          </div>
        </div>
      </div>
      <br />
      <p>Copyright © 2023 Threshold UAV - All Rights Reserved.</p>
      <br />
    </section>
  )
}

const CallToAction = (props) => {
  const { toast_ref, select_ref } = props

  const message_ref = React.useRef()
  const email_ref = React.createRef()
  const name_ref = React.createRef()

  return (
    <>
      <InputGroup id="name_input" inputRef={name_ref} placeholder="First Name" leftIcon="person" large />
      <InputGroup inputRef={email_ref} placeholder="Email" leftIcon="envelope" large />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          textAlign: 'right',
          justifyContent: 'right',
        }}
      >
        <span
          style={{
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            marginRight: '1rem',
          }}
        >
          Looking for something specific?
        </span>
        <br />
        <HTMLSelect ref={select_ref} options={['None', 'Software early access', 'Service consultation']} />
      </div>

      <TextArea fill inputRef={message_ref} placeholder="My message..."></TextArea>
      <p
        style={{
          fontSize: '1rem',
          color: SECONDARY,
        }}
      >{`* We won't give your email to anyone or send you spam`}</p>
      <Button
        intent="primary"
        large
        className="button"
        text="Send my message"
        style={{
          width: 'fit-content',
        }}
        onClick={() => {
          if (name_ref.current.value.length == 0) return
          if (email_ref.current.value.length == 0) return
          if (message_ref.current.value.length == 0) return

          console.log('Good Message!')

          let _message = message_ref.current.value
          if (select_ref.current.value != 'None') {
            // if the user has selected something specific,
            // tag it in the outbound message
            _message = `[${select_ref.current.value}]\n\n${_message}`
          }

          const message = {
            first_name: name_ref.current.value,
            email: email_ref.current.value,
            message: _message,
          }

          name_ref.current.value = ''
          email_ref.current.value = ''
          message_ref.current.value = ''
          select_ref.current.value = 'None'

          toast_ref.current.show({
            message: 'Message Sent',
            intent: 'success',
          })

          fetch('/api/message', {
            method: 'POST',
            body: JSON.stringify(message),
            headers: {
              'Content-Type': 'application/json',
            },
          })
        }}
      />
    </>
  )
}

const QuoteForm = (props) => {
  const { toast_ref } = props

  const message_ref = React.useRef()
  const email_ref = React.createRef()
  const name_ref = React.createRef()

  return (
    <>
      <InputGroup id="name_input" inputRef={name_ref} placeholder="First Name" leftIcon="person" large />
      <InputGroup inputRef={email_ref} placeholder="Email" leftIcon="envelope" large />
      <TextArea fill inputRef={message_ref} placeholder="Number of acres, timelines, etc..."></TextArea>
      <p
        style={{
          fontSize: '1rem',
          color: SECONDARY,
        }}
      >{`* We won't give your email to anyone or send you spam`}</p>
      <Button
        intent="primary"
        large
        className="button"
        text="Get My Free Quote"
        style={{
          width: 'fit-content',
        }}
        onClick={() => {
          if (name_ref.current.value.length == 0) return
          if (email_ref.current.value.length == 0) return
          if (message_ref.current.value.length == 0) return

          console.log('Good Message!')

          let _message = message_ref.current.value
          _message = `[Rock Map Quote]\n\n${_message}`

          const message = {
            first_name: name_ref.current.value,
            email: email_ref.current.value,
            message: _message,
          }

          name_ref.current.value = ''
          email_ref.current.value = ''
          message_ref.current.value = ''

          toast_ref.current.show({
            message: 'We will email you back soon.',
            intent: 'success',
          })

          fetch('/api/message', {
            method: 'POST',
            body: JSON.stringify(message),
            headers: {
              'Content-Type': 'application/json',
            },
          })
        }}
      />
    </>
  )
}

function DownloadCard(props) {
  const { file_href } = props
  const [is_loading, setIsLoading] = React.useState(true)
  const file_name = file_href.substring(file_href.lastIndexOf('/') + 1, file_href.length)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        console.log('Clicking Download')
        setIsLoading(false)
        document.querySelector('a#DOWNLOAD_LINK').click()
      }, 750)
    }
  }, [])

  return (
    <Card
      style={{
        outline: '2px solid #292933',
        borderRadius: '7px',
        maxWidth: '25rem',
        alignSelf: 'center',
        margin: '0 auto',
        fontSize: '1rem',
      }}
    >
      <h1
        style={{
          fontSize: '1.25rem',
        }}
      >
        Your download should start automatically...
      </h1>
      <h2 style={{ fontSize: '1rem' }}>Otherwise, click the link below</h2>
      <br />
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <span
          style={{
            marginTop: '1rem',
            marginRight: '1rem',
            fontSize: '1rem',
          }}
        >
          {file_name}
        </span>
        <Button
          large
          icon="download"
          text="Download"
          loading={is_loading}
          onClick={() => {
            document.querySelector(`a#DOWNLOAD_LINK`).click()
          }}
        >
          <a id="DOWNLOAD_LINK" href={file_href} download={file_name} />
        </Button>
      </div>
    </Card>
  )
}

export { TopBar, DefaultHead, ClosingSection, CallToAction, DownloadCard, QuoteForm, OpenGraphTags }
