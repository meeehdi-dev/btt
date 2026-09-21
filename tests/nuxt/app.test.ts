import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import App from '../../app/app.vue'

describe('application shell', () => {
  it('renders the Nuxt application root', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          UApp: { template: '<div><slot /></div>' },
          NuxtLayout: { template: '<div><slot /></div>' },
          NuxtPage: { template: '<main />' },
        },
      },
    })
    expect(wrapper.find('main').exists()).toBe(true)
  })
})
