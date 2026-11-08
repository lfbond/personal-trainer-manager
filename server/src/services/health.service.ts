export class HealthService {
  execute() {
    return {
      status: 'ok',
      message: 'API funcionando corretamente.',
    }
  }
}