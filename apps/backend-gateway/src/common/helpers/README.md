# BackendLogger

BackendLogger เป็น wrapper class สำหรับ Winston logger ที่รวมการทำงานของ console logging และ Loki transport เข้าด้วยกัน

## ✨ Features

- **Dual Transport**: รองรับทั้ง Console และ Loki transport
- **Fallback Mechanism**: หาก Loki ล้มเหลว จะ fallback ไปใช้ console เท่านั้น
- **Type Safety**: ใช้ TypeScript types ที่ชัดเจน
- **Error Handling**: จัดการ errors อย่างเหมาะสม
- **IAM Support**: รองรับ tenant_id และ user_id
- **Health Check**: สามารถตรวจสอบสถานะของ logger ได้

## 🚀 การใช้งาน

### Basic Usage

```typescript
import { BackendLogger } from './common/helpers/backend.logger';

export class UserController {
  private readonly logger = new BackendLogger(UserController.name);

  async createUser(userData: any) {
    try {
      // Log info
      this.logger.log('Creating new user', 'UserController', { 
        tenant_id: 'tenant123', 
        user_id: 'current_user' 
      });

      // Log performance
      const startTime = Date.now();
      const user = await this.userService.create(userData);
      const duration = Date.now() - startTime;
      
      this.logger.logPerformance('create_user', duration, 'UserController', {
        tenant_id: 'tenant123'
      });

      // Log business event
      this.logger.logBusinessEvent('USER_CREATED', { 
        user_id: user.id, 
        email: user.email 
      }, 'UserController', { 
        tenant_id: 'tenant123' 
      });

      return user;
    } catch (error) {
      // Log error
      this.logger.error('Failed to create user', error, 'UserController', {
        tenant_id: 'tenant123'
      });
      throw error;
    }
  }
}
```

### Logging Levels

```typescript
// Error (level 0)
logger.error('Error message', stackTrace, 'context', iamInfo);

// Warning (level 1)
logger.warn('Warning message', 'context', iamInfo);

// Info/Log (level 2)
logger.log('Info message', 'context', iamInfo);

// HTTP (level 3)
logger.http('HTTP request', 'context', iamInfo);

// Verbose (level 4)
logger.verbose('Verbose message', 'context', iamInfo);

// Debug (level 5)
logger.debug('Debug message', 'context', iamInfo);

// Silly (level 6)
logger.silly('Silly message', 'context', iamInfo);
```

### Specialized Methods

```typescript
// Log actions
logger.logInfoAction('CREATE_USER', 'User created successfully', 'UserService', iamInfo);

// Performance logging
logger.logPerformance('database_query', 150, 'DatabaseService', iamInfo);

// Business events
logger.logBusinessEvent('USER_LOGIN', { ip: '192.168.1.1' }, 'AuthService', iamInfo);

// Custom labels
logger.logWithLabels('Custom message', { custom_label: 'value' }, 'TestService', iamInfo);
```

## ⚙️ Configuration

### Environment Variables

```bash
# Loki Configuration
LOKI_HOST=localhost
LOKI_PORT=3100
LOKI_PROTOCOL=http
LOKI_USERNAME=username
LOKI_PASSWORD=password

# Application Configuration
APP_NAME=carmen-inventory
NODE_ENV=development
LOG_LEVEL=info
```

### Default Values

```typescript
const defaultConfig = {
  host: 'localhost',
  port: 3100,
  protocol: 'http',
  json: true,
  format: 'json',
  replaceTimestamp: true,
  labels: {
    application: 'carmen-inventory',
    environment: 'development'
  }
};
```

## 🔍 Health Check

```typescript
// Check if logger is healthy
if (logger.isHealthy()) {
  console.log('Logger is working properly');
}

// Get detailed status
const status = logger.getStatus();
console.log('Logger status:', status);
// Output: { isInitialized: true, hasLoki: true, hasConsole: true }
```

## 🛡️ Error Handling

BackendLogger มี error handling ที่แข็งแกร่ง:

1. **Configuration Validation**: ตรวจสอบว่า config ครบถ้วนหรือไม่
2. **Loki Fallback**: หาก Loki ล้มเหลว จะ fallback ไปใช้ console
3. **Safe Logging**: ทุก logging operation ถูก wrap ด้วย try-catch
4. **Graceful Degradation**: หาก winston ล้มเหลว จะใช้ console logging แทน

## 📝 Best Practices

1. **Always provide context**: ใช้ context string เพื่อระบุที่มาของ log
2. **Use IAM info**: ส่ง tenant_id และ user_id เมื่อเป็นไปได้
3. **Structured logging**: ใช้ meta parameter สำหรับข้อมูลเพิ่มเติม
4. **Performance tracking**: ใช้ logPerformance สำหรับ operations ที่ใช้เวลานาน
5. **Business events**: ใช้ logBusinessEvent สำหรับ events ที่สำคัญ

## 🔧 Troubleshooting

### Common Issues

1. **Loki connection failed**: Logger จะ fallback ไปใช้ console
2. **Configuration missing**: จะแสดง warning และใช้ default values
3. **Winston initialization failed**: จะใช้ console-only mode

### Debug Mode

```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';

// Check logger status
const status = logger.getStatus();
console.log('Logger status:', status);
```

## 📚 Dependencies

- `winston`: Main logging library
- `winston-loki`: Loki transport for Winston
- `@nestjs/common`: ConsoleLogger for fallback
