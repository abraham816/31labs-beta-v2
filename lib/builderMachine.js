import { createMachine } from 'xstate';

export const builderMachine = createMachine({
  id: 'builder',
  initial: 'idle',
  context: {
    businessIdea: '',
    brandName: '',
    heroHeader: '',
    heroSubheader: '',
    products: [],
    salesTone: 'friendly'
  },
  states: {
    idle: {
      on: { START: 'intake' }
    },
    intake: {
      on: { 
        SUBMIT: 'clarify',
        COMPLETE: 'generate'
      }
    },
    clarify: {
      on: { ANSWER: 'generate' }
    },
    generate: {
      on: { DONE: 'preview' }
    },
    preview: {
      on: { 
        REFINE: 'refine',
        SAVE: 'save'
      }
    },
    refine: {
      on: { DONE: 'preview' }
    },
    save: {
      on: { SAVED: 'test' }
    },
    test: {
      on: { BACK: 'preview' }
    },
    done: {}
  }
});
