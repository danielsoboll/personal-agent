import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

/**
 * iOS/iPadOS: „Autofill Contact“-Leiste bei Textfeldern unterdrücken.
 * `off` reicht oft nicht — `new-password` bei type=text ist der zuverlässige Trick.
 */
const IOS_SUPPRESS_CONTACT_AUTOCOMPLETE = 'new-password' as const

export type AutofillInputProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'inputMode' | 'autoComplete' | 'autoCorrect' | 'autoCapitalize' | 'spellCheck' | 'name'
>

type AutofillTextareaProps = Pick<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'autoComplete' | 'autoCorrect' | 'autoCapitalize' | 'spellCheck' | 'name'
>

export const CASE_TITLE_FIELD_NAME = 'behoerdenpost-case-title-field'

/** Fallname beim Anlegen — neutrale `name`/id ohne „family-name“. */
export function caseTitleInputProps(): AutofillInputProps {
  return {
    type: 'text',
    inputMode: 'text',
    autoComplete: IOS_SUPPRESS_CONTACT_AUTOCOMPLETE,
    autoCorrect: 'off',
    autoCapitalize: 'words',
    spellCheck: false,
    name: CASE_TITLE_FIELD_NAME,
  }
}

/** Freitext einzeilig (Codes, Titel …). */
export function oneLineTextInputProps(fieldName: string): AutofillInputProps {
  return {
    type: 'text',
    inputMode: 'text',
    autoComplete: IOS_SUPPRESS_CONTACT_AUTOCOMPLETE,
    autoCorrect: 'off',
    autoCapitalize: 'sentences',
    spellCheck: false,
    name: fieldName,
  }
}

/** Mehrzeiliger Freitext. */
export function multilineTextInputProps(fieldName: string): AutofillTextareaProps {
  return {
    autoComplete: IOS_SUPPRESS_CONTACT_AUTOCOMPLETE,
    autoCorrect: 'off',
    autoCapitalize: 'sentences',
    spellCheck: false,
    name: fieldName,
  }
}
