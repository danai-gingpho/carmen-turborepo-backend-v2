export const RUNNING_CODE_PRESET = {
  PR: {
    config: {
      A: 'PR',
      B: `date('yyyyMM')`,
      C: `running(5, '0')`,
      format: '{A}{B}{C}',
    },
  },
  PO: {
    config: {
      A: 'PO',
      B: `date('yyyyMM')`,
      C: `running(5, '0')`,
      format: '{A}{B}{C}',
    },
  },
  GRN: {
    config: {
      A: 'GRN',
      B: `date('yyyyMM')`,
      C: `running(5, '0')`,
      format: '{A}{B}{C}',
    },
  },
  CN: {
    config: {
      A: 'CN',
      B: `date('yyyyMM')`,
      C: `running(5, '0')`,
      format: '{A}{B}{C}',
    },
  },
};
