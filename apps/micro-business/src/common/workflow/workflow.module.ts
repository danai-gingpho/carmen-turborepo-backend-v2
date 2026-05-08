import { Module } from '@nestjs/common';
import { WorkflowOrchestratorService } from './workflow-orchestrator.service';

@Module({
  providers: [WorkflowOrchestratorService],
  exports: [WorkflowOrchestratorService],
})
export class WorkflowModule {}
