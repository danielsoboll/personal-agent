'use client'

import { useCallback, useRef, useState, type FocusEvent, type InputHTMLAttributes } from 'react'

import { useAutoFocusInput } from '@/lib/useAutoFocusInput'

import type { AutofillInputProps } from '@/lib/formInputAutofill'

type AutofillSafeTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  autofillProps: AutofillInputProps
  autoFocus?: boolean
}

export default function AutofillSafeTextInput({
  autofillProps,
  autoFocus = false,
  onFocus,
  onBlur,
  onTouchStart,
  ...rest
}: AutofillSafeTextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [writable, setWritable] = useState(autoFocus)

  useAutoFocusInput(inputRef, autoFocus, rest.id)

  const enableWritable = useCallback(() => {
    setWritable(true)
  }, [])

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      setWritable(true)
      onFocus?.(event)
    },
    [onFocus],
  )

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      setWritable(false)
      onBlur?.(event)
    },
    [onBlur],
  )

  return (
    <input
      ref={inputRef}
      {...rest}
      {...autofillProps}
      readOnly={!writable}
      onTouchStart={(event) => {
        enableWritable()
        onTouchStart?.(event)
      }}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}
