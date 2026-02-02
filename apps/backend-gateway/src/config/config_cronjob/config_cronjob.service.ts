import { Injectable, HttpException } from '@nestjs/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { envConfig } from 'src/libs/config.env';

@Injectable()
export class ConfigCronjobService {
  private readonly logger = new BackendLogger(ConfigCronjobService.name);
  private readonly CRONJOB_SERVICE_URL = `http://${envConfig.CRONJOB_SERVICE_HOST}:${envConfig.CRONJOB_SERVICE_PORT}`;

  private async request(endpoint: string, options: RequestInit = {}) {
    console.log('CRONJOB_SERVICE_URL', this.CRONJOB_SERVICE_URL);
    console.log('endpoint', endpoint);
    try {
      const response = await fetch(`${this.CRONJOB_SERVICE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new HttpException(
          error.message || 'Request failed',
          response.status,
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to connect to cronjob service', 503);
    }
  }

  async getAll() {
    return this.request('/api/cronjobs');
  }

  async getById(id: string) {
    return this.request(`/api/cronjobs/${id}`);
  }

  async create(data: any) {
    return this.request('/api/cronjobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: any) {
    return this.request(`/api/cronjobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: string) {
    return this.request(`/api/cronjobs/${id}`, {
      method: 'DELETE',
    });
  }

  async start(id: string) {
    return this.request(`/api/cronjobs/${id}/start`, {
      method: 'POST',
    });
  }

  async stop(id: string) {
    return this.request(`/api/cronjobs/${id}/stop`, {
      method: 'POST',
    });
  }

  async execute(id: string) {
    return this.request(`/api/cronjobs/${id}/execute`, {
      method: 'POST',
    });
  }

  async getActiveInMemory() {
    return this.request('/api/cronjobs/debug/memory');
  }
}
