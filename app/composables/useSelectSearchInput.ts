import { computed } from 'vue'

export type SelectSearchInput = {
  placeholder: string
  icon: string
  autofocus: boolean
}

export function useSelectSearchInput(placeholder: string) {
  return computed<SelectSearchInput>(() => ({
    placeholder,
    icon: 'lucide:search',
    autofocus: true,
  }))
}
