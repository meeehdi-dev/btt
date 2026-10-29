import { readFileSync } from 'node:fs'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { vModalAutofocus } from '../../app/utils/modal-autofocus'

const Fixture = defineComponent({
  directives: { modalAutofocus: vModalAutofocus },
  props: { active: { default: true }, ready: { default: true } },
  template: `<div role="dialog" data-state="open">
    <button class="close">Close</button>
    <form v-if="ready" v-show="active" v-modal-autofocus="active">
      <button class="parent-picker">Choose parent</button>
      <div data-modal-autofocus><input class="primary" /></div>
      <input class="other" />
    </form>
  </div>`,
})
let wrapper: VueWrapper

async function flushFocus() {
  await nextTick()
  await vi.advanceTimersByTimeAsync(20)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function (
    this: HTMLElement,
  ) {
    return (this.closest('[style*="display: none"]') ? [] : [{}]) as unknown as DOMRectList
  })
})
afterEach(() => {
  wrapper?.unmount()
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('modal primary-field autofocus', () => {
  it.each([
    ['components/ClientCreateForm.vue', 'name'],
    ['components/ProjectCreateForm.vue', 'name'],
    ['components/ReleaseCreateForm.vue', 'name'],
    ['components/TicketCreateForm.vue', 'title'],
    ['components/TicketCreateForm.vue', 'linkDraftUrl'],
    ['components/SettingsModal.vue', 'start'],
    ['pages/tickets/[id]/index.vue', 'titleDraft'],
    ['pages/tickets/[id]/index.vue', 'url'],
    ['pages/agenda.vue', 'editingTime'],
  ])('declares the expected primary field in %s: %s', (path, model) => {
    const source = readFileSync(`${process.cwd()}/app/${path}`, 'utf8')
    const control = source.match(new RegExp(`<U\\w+[^>]*v-model="${model}"[^>]*>`))?.[0]
    expect(control).toContain('data-modal-autofocus')
    expect(source).toContain('v-modal-autofocus')
  })

  it('focuses the primary input rather than the close or hierarchy buttons', async () => {
    wrapper = mount(Fixture, { attachTo: document.body })
    await flushFocus()
    expect(document.activeElement).toBe(wrapper.get('.primary').element)
  })

  it('focuses after asynchronous form availability and on retry', async () => {
    wrapper = mount(Fixture, { props: { ready: false }, attachTo: document.body })
    await flushFocus()
    await wrapper.setProps({ ready: true })
    await flushFocus()
    expect(document.activeElement).toBe(wrapper.get('.primary').element)
    await wrapper.setProps({ ready: false })
    await wrapper.setProps({ ready: true })
    await flushFocus()
    expect(document.activeElement).toBe(wrapper.get('.primary').element)
  })

  it('refocuses a retained form on reopen/step return without losing its draft', async () => {
    wrapper = mount(Fixture, { attachTo: document.body })
    await flushFocus()
    await wrapper.get('.primary').setValue('Kept draft')
    await wrapper.setProps({ active: false })
    await wrapper.setProps({ active: true })
    await flushFocus()
    expect(document.activeElement).toBe(wrapper.get('.primary').element)
    expect(wrapper.get<HTMLInputElement>('.primary').element.value).toBe('Kept draft')
  })

  it('does not reset focus during ordinary form updates', async () => {
    wrapper = mount(Fixture, { attachTo: document.body })
    await flushFocus()
    const other = wrapper.get<HTMLInputElement>('.other').element
    other.focus()
    wrapper.vm.$forceUpdate()
    await flushFocus()
    expect(document.activeElement).toBe(other)
  })

  it('does not steal focus from a nested dialog or force focus after it closes', async () => {
    wrapper = mount(Fixture, { attachTo: document.body })
    const nested = document.createElement('div')
    nested.setAttribute('role', 'dialog')
    nested.setAttribute('data-state', 'open')
    nested.innerHTML = '<input />'
    document.body.append(nested)
    const input = nested.querySelector('input')!
    input.focus()
    await flushFocus()
    expect(document.activeElement).toBe(input)
    nested.remove()
    const launcher = wrapper.get<HTMLButtonElement>('.parent-picker').element
    launcher.focus()
    wrapper.vm.$forceUpdate()
    await flushFocus()
    expect(document.activeElement).toBe(launcher)
  })

  it('cancels scheduled focus when hidden or unmounted', async () => {
    wrapper = mount(Fixture, { attachTo: document.body })
    await wrapper.setProps({ active: false })
    await flushFocus()
    expect(document.activeElement).toBe(document.body)
    await wrapper.setProps({ active: true })
    wrapper.unmount()
    await flushFocus()
    expect(document.activeElement).toBe(document.body)
  })

  it.each([
    '<button data-modal-autofocus>Setting</button>',
    '<div data-modal-autofocus><span role="spinbutton" tabindex="0">08</span></div>',
  ])('supports select triggers and segmented time fields: %s', async (control) => {
    wrapper = mount(
      defineComponent({
        directives: { modalAutofocus: vModalAutofocus },
        template: `<div role="dialog" data-state="open"><form v-modal-autofocus>${control}</form></div>`,
      }),
      { attachTo: document.body },
    )
    await flushFocus()
    expect(document.activeElement).toBe(wrapper.get('button, [tabindex="0"]').element)
  })

  it('does not focus a disabled primary field', async () => {
    wrapper = mount(
      defineComponent({
        directives: { modalAutofocus: vModalAutofocus },
        template:
          '<div role="dialog" data-state="open"><form v-modal-autofocus><input data-modal-autofocus disabled /></form></div>',
      }),
      { attachTo: document.body },
    )
    await flushFocus()
    expect(document.activeElement).toBe(document.body)
  })
})
