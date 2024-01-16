'use client'

import React from 'react'

// <Setup Blueprint>
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import { FocusStyleManager } from '@blueprintjs/core'
FocusStyleManager.onlyShowFocusOnTabs()

import { Button, InputGroup } from '@blueprintjs/core'
import { marked } from 'marked'

const INIT_STATE = {
  is_loading: false,
  markdown_text: null,
}

export default function Page() {
  const [state, setState] = React.useState(INIT_STATE)
  const search_input_ref = React.useRef()

  React.useEffect(() => {
    if (!state.markdown_text) return

    document.querySelector('article#MARKDOWN_CONTENT').innerHTML = marked.parse(state.markdown_text)
  }, [state.markdown_text])

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        padding: '3px',
      }}
    >
      <div
        id="side_bar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          minWidth: '15rem',
          height: '100%',
          outline: '1px solid black',
          borderRadius: '7px',
          padding: '0.5rem',
        }}
      >
        <InputGroup leftIcon="search" inputRef={search_input_ref} autoCorrect="off" id="CASE_INPUT"></InputGroup>

        <Button
          loading={state.is_loading}
          onClick={async () => {
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

            const res = await fetch(`/getCaseViz/${case_id}`)
            const text = await res.text()

            setState(() => {
              return {
                is_loading: false,
                markdown_text: text,
              }
            })
          }}
        >
          Search
        </Button>

        {/* <Button
          icon="lab-test"
          onClick={() => {
            console.log(state)
          }}
        ></Button> */}
      </div>
      <div
        style={{
          height: '100%',
          overflow: 'auto',
          padding: '0.5rem',
        }}
      >
        <article id="MARKDOWN_CONTENT"></article>
      </div>
    </main>
  )
}
