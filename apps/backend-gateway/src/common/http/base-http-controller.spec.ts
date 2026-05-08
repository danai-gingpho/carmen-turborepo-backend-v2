import { HttpStatus } from '@nestjs/common';
import { BaseHttpController } from './base-http-controller';
import { Result } from '../result/result';

class DummyController extends BaseHttpController {
  callRespond(...args: Parameters<BaseHttpController['respond']>) {
    return (this as unknown as { respond: BaseHttpController['respond'] }).respond(...args);
  }
}

function mockRes() {
  const res: { status: jest.Mock; send: jest.Mock } = {} as unknown as { status: jest.Mock; send: jest.Mock };
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res as unknown as Parameters<BaseHttpController['respond']>[0] & { status: jest.Mock; send: jest.Mock };
}

describe('BaseHttpController.respond', () => {
  let ctrl: DummyController;

  beforeEach(() => {
    ctrl = new DummyController();
    BaseHttpController.enrichmentService = null;
  });

  it('sends ok Result without enrichment when locator is null', async () => {
    const res = mockRes();
    const ok = Result.ok({ id: 'x' });
    await ctrl.callRespond(res, ok);
    expect(res.status).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledTimes(1);
    const sent = res.send.mock.calls[0][0];
    expect(sent.data).toEqual({ id: 'x' });
  });

  it('calls enrichmentService.enrichIfRequested on ok Result data', async () => {
    const enrich = jest.fn().mockResolvedValue({ id: 'x', audit: { fake: true } });
    BaseHttpController.enrichmentService = { enrichIfRequested: enrich };

    const res = mockRes();
    const ok = Result.ok({ id: 'x' });
    await ctrl.callRespond(res, ok);

    expect(enrich).toHaveBeenCalledWith({ id: 'x' });
    const sent = res.send.mock.calls[0][0];
    expect(sent.data).toEqual({ id: 'x', audit: { fake: true } });
  });

  it('does not call enrich on error Result', async () => {
    const enrich = jest.fn().mockResolvedValue(undefined);
    BaseHttpController.enrichmentService = { enrichIfRequested: enrich };

    const res = mockRes();
    const err = Result.error('nope');
    await ctrl.callRespond(res, err);

    expect(enrich).not.toHaveBeenCalled();
  });

  it('passes through a non-Result body untouched', async () => {
    const enrich = jest.fn().mockResolvedValue({ touched: true });
    BaseHttpController.enrichmentService = { enrichIfRequested: enrich };

    const res = mockRes();
    await ctrl.callRespond(res, { foo: 'bar' });
    expect(enrich).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('respects customStatus override on ok results', async () => {
    const res = mockRes();
    await ctrl.callRespond(res, Result.ok({}), HttpStatus.CREATED);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
  });
});
