'use client'

import React from 'react'

// <Setup Blueprint>
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import { AnchorButton, FocusStyleManager } from '@blueprintjs/core'
FocusStyleManager.onlyShowFocusOnTabs()

import { Button, InputGroup, Tabs, Tab } from '@blueprintjs/core'
import { marked } from 'marked'

// Using ES6 import syntax
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'

import 'highlight.js/styles/stackoverflow-light.css'

// Then register the languages you need
hljs.registerLanguage('json', json)

const INIT_STATE = {
  is_loading: false,
  markdown_text: null,
  case_json: null,
}

export default function Page() {
  const [state, setState] = React.useState(INIT_STATE)
  const search_input_ref = React.useRef()

  React.useEffect(() => {
    if (!state.markdown_text) return

    document.querySelector('article#MARKDOWN_CONTENT').innerHTML = marked.parse(state.markdown_text)
  }, [state.markdown_text])

  React.useEffect(() => {
    if (!state.case_json) return

    const highlighted_json = hljs.highlight(JSON.stringify(state.case_json, null, 2), { language: 'json' }).value

    document.querySelector('pre#JSON_CONTENT').innerHTML = highlighted_json
  }, [state.case_json])

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}
    >
      <div
        style={{
          padding: '0.5rem',
        }}
      >
        <AnchorButton href="/" small minimal text="Home" icon={'undo'} />
      </div>
      <div
        id="search"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          minWidth: '15rem',

          // outline: '1px solid black',
          borderRadius: '7px',
          padding: '0.5rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '30rem',
            // maxWidth: '50rem',
            margin: '0 auto',
          }}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              console.log('form submitted')

              if (search_input_ref.current.value == '') return
              if (search_input_ref.current.value == null) return
              const case_id = search_input_ref.current.value
              search_input_ref.current.value = ''

              setState((state) => {
                return {
                  ...state,
                  is_loading: true,
                  markdown_text: null,
                }
              })

              console.log(case_id)

              const res = await fetch(`api/getCaseViz/${case_id}`)
              const data = await res.json()
              const { markdown_text, case_json } = data

              setState(() => {
                return {
                  is_loading: false,
                  markdown_text: markdown_text,
                  case_json: case_json,
                }
              })
            }}
          >
            <InputGroup
              style={{
                width: '100%',
              }}
              leftIcon="search"
              inputRef={search_input_ref}
              autoCorrect="off"
              id="CASE_INPUT"
              rightElement={
                <Button loading={state.is_loading} type="submit">
                  Search
                </Button>
              }
            />
          </form>
        </div>

        {/* <Button
          loading={state.is_loading}
          onClick={async () => {
            if (search_input_ref.current.value == '') return
            if (search_input_ref.current.value == null) return
            const case_id = search_input_ref.current.value
            search_input_ref.current.value = ''

            setState((state) => {
              return {
                ...state,
                is_loading: true,
                markdown_text: null,
              }
            })

            console.log(case_id)

            const res = await fetch(`api/getRawCaseJson/${case_id}`)
            const json = await res.json()

            setState(() => {
              return {
                is_loading: false,
                case_json: json,
              }
            })
          }}
        >
          Raw Json
        </Button>

        <Button
          icon="lab-test"
          onClick={() => {
            console.log(state)
          }}
        /> */}

        {/* <Button
          icon="lab-test"
          onClick={() => {
            fetch('api/newExpungement', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // 'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: JSON.stringify({
                sender: 'shane.au.wade@gmail.com',
                subject: 'New Expungement',
                body_text:
                  "Hey Shane, \n\nI'd like to get expungement forms generated for case: 0EM00001.\n\nThanks,\nJosh",
              }),
            }).then((res) => {
              console.log(res)
            })
          }}
        ></Button> */}
      </div>
      <div
        style={{
          height: '100%',
          overflow: 'auto',
          padding: '0.75rem',
          // outline: '1px solid black',
          borderRadius: '7px',
        }}
      >
        <Tabs>
          <Tab id="md" title="Markdown" panel={<article id="MARKDOWN_CONTENT"></article>} />
          <Tab id="js" title="Json" panel={<pre id="JSON_CONTENT"></pre>} />
        </Tabs>
      </div>
    </main>
  )
}
