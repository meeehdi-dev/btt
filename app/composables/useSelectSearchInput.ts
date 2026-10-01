import { computed, onMounted, ref } from 'vue'

export type SelectSearchInput = {
  placeholder: string
  icon: string
  autofocus: boolean
}

export function useSelectSearchInput(placeholder: string) {
  const isTouchDevice = ref(false)
  onMounted(() => {
    isTouchDevice.value = window.matchMedia('(pointer: coarse)').matches
  })

  return computed<SelectSearchInput>(() => ({
    placeholder,
    icon: 'lucide:search',
    autofocus: !isTouchDevice.value,
  }))
}
