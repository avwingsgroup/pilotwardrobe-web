import { computed, reactive, ref, type UnwrapRef } from 'vue'
import { toApiError, type ApiError } from '@/api/errors'
import { runValidators, type Validator } from '@/utils/validators'

type Rules<T> = { [K in keyof T]?: Validator<T[K]>[] }

/**
 * Minimal form state machine: values, touched/validated fields, client rules and
 * server 422 field errors mapped onto the same keys (snake_case → camelCase
 * conversion happens in the HTTP layer).
 *
 * States: default → focused/dirty → valid | invalid → submitting → success | server error
 */
export function useForm<T extends Record<string, unknown>>(initial: T, rules: Rules<T> = {}) {
  const values = reactive({ ...initial }) as UnwrapRef<T>
  const errors = reactive<Record<string, string | undefined>>({})
  const touched = reactive<Record<string, boolean>>({})
  const submitting = ref(false)
  const submitted = ref(false)
  const succeeded = ref(false)
  const formError = ref<string | null>(null)
  const lastError = ref<ApiError | null>(null)

  function validateField(key: keyof T & string): boolean {
    const fieldRules = rules[key] as Validator<unknown>[] | undefined
    if (!fieldRules) {
      errors[key] = undefined
      return true
    }
    const message = runValidators((values as T)[key], fieldRules)
    errors[key] = message ?? undefined
    return !message
  }

  function validate(): boolean {
    let ok = true
    for (const key of Object.keys(rules) as (keyof T & string)[]) {
      touched[key] = true
      if (!validateField(key)) ok = false
    }
    return ok
  }

  function touch(key: keyof T & string) {
    touched[key] = true
    validateField(key)
  }

  /** Error shown inline only once a field was touched or a submit was attempted. */
  const fieldError = (key: keyof T & string) => (touched[key] || submitted.value ? errors[key] : undefined)

  const isValid = computed(() =>
    (Object.keys(rules) as (keyof T & string)[]).every((key) => {
      const fieldRules = rules[key] as Validator<unknown>[] | undefined
      return !fieldRules || runValidators((values as T)[key], fieldRules) === null
    }),
  )

  function applyServerErrors(error: ApiError) {
    for (const [key, messages] of Object.entries(error.fieldErrors)) {
      errors[key] = messages[0]
      touched[key] = true
    }
    const hasFieldErrors = Object.keys(error.fieldErrors).length > 0
    formError.value = hasFieldErrors && error.isValidation ? null : error.message
  }

  async function submit<R>(handler: (vals: T) => Promise<R>): Promise<R | undefined> {
    submitted.value = true
    formError.value = null
    succeeded.value = false
    if (!validate()) return undefined
    submitting.value = true
    try {
      const result = await handler({ ...(values as T) })
      succeeded.value = true
      return result
    } catch (e) {
      const apiError = toApiError(e)
      lastError.value = apiError
      applyServerErrors(apiError)
      return undefined
    } finally {
      submitting.value = false
    }
  }

  function reset(next: Partial<T> = {}) {
    Object.assign(values as object, { ...initial, ...next })
    for (const key of Object.keys(errors)) errors[key] = undefined
    for (const key of Object.keys(touched)) touched[key] = false
    submitted.value = false
    succeeded.value = false
    formError.value = null
  }

  return {
    values,
    errors,
    touched,
    submitting,
    submitted,
    succeeded,
    formError,
    lastError,
    isValid,
    fieldError,
    touch,
    validate,
    validateField,
    submit,
    reset,
    applyServerErrors,
  }
}
