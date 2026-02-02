import { IPaginate } from "src/shared-dto/paginate.dto";

export class ResponseLib {
  static success(data: any) {
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

  static successWithPaginate(data: any, paginate: IPaginate) {
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

  static created(data: any) {
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

  static successWithBuCodePaginate(data: any[]) {

    return {
      data,
      status: 200,
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }
}