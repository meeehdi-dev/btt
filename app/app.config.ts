export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      secondary: 'blue',
      info: 'blue',
      success: 'green',
      warning: 'orange',
      error: 'red',
      neutral: 'zinc',
    },
    card: {
      slots: {
        header: () => 'p-2',
        body: () => 'p-2',
        footer: () => 'p-2',
      },
    },
  },
})
