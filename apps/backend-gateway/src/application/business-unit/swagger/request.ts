export const request_params_key = {
  '200': {
    description: 'Config found',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  },
  '400': {
    description: 'Bad request',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  },
};
