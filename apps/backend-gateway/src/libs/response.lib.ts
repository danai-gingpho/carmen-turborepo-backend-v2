export class ResponseLib {
  static success(data: unknown) {
    return {
      data: data,
      // response: {
      //   status: 200,
      //   message: 'Success',
      // },
      status: 200,
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
    };
  }

  static successWithPaginate(data: unknown, paginate: { total: number; page: number; perpage: number; pages: number }) {
    return {
      data: data,
      paginate: paginate,
      // response: {
      //   status: 200,
      //   message: 'Success',
      // },

      status: 200,
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
    };
  }

  static created(data: unknown) {
    return {
      data: data,
      // response: {
      //   status: 201,
      //   message: 'Success',
      // },

      status: 201,
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
    };
  }

  static error(status: number, message: string) {
    return {
      data: null,
      // response: {
      //   status: status,
      //   message: message,
      // },

      status: status,
      success: false,
      message: message,
      timestamp: new Date().toISOString(),
    };
  }

  static successWithBuCodePaginate(data: unknown[]) {

    return {
      data,
      status: 200,
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }
}