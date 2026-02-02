import {
  Stage,
  ActionConfig,
  RoutingRule,
  ConditionConfig,
  WorkflowData,
  StageInfo,
  PreviousStageItem,
  NavigationHistory,
  NavigationInfo,
  NavigateForwardResult,
  NavigateBackResult,
} from '@/common';

// ==================== WORKFLOW NAVIGATOR CLASS ====================

/**
 * WorkflowNavigator - manages workflow navigation with history tracking
 * Supports forward navigation, backward navigation to any previous stage, and history retrieval
 */
export class WorkflowNavigatorService {
  private workflowData: WorkflowData;
  private history: string[] = [];
  private currentIndex: number = -1;

  constructor(workflowData: WorkflowData, initialStage?: string) {
    this.workflowData = workflowData;
    if (initialStage) {
      this.history.push(initialStage);
      this.currentIndex = 0;
    }
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Load existing history (useful for restoring session from frontend)
   */
  loadHistory(history: string[], currentIndex?: number): void {
    this.history = [...history];
    this.currentIndex = currentIndex ?? this.history.length - 1;
  }

  /**
   * Get current stage name
   */
  getCurrentStage(): string | null {
    return this.currentIndex === -1 ? null : this.history[this.currentIndex];
  }

  /**
   * Get current stage name
   */
  getCurrentStageDetail(): Stage | null {
    const currentStageName = this.getCurrentStage();
    if (!currentStageName) {
      return null;
    }
    return this.findStageByName(currentStageName);
  }

  /**
   * Navigate forward to next stage based on routing rules
   * If currentStatus is empty, returns the first stage of the workflow
   */
  navigateForward(requestData: Record<string, any> = {}): NavigateForwardResult {
    const currentStatus = this.getCurrentStage();
    if (!currentStatus) {
      // First stage of workflow - initialize with the first stage
      const firstStage = this.workflowData.stages[0];
      if (!firstStage) {
        throw new Error('No stages defined in workflow');
      }

      this.history.push(firstStage.name);
      this.currentIndex = 0;

      return {
        previous_stage: null,
        current_stage: firstStage.name,
        navigation_info: this.getNavigationInfo(firstStage.name, requestData),
        history: this.getHistory(),
      };
    }

    const navigation = this.getNavigationInfo(currentStatus, requestData);
    console.log('navigation', navigation);
    if (!navigation.workflow_next_step) {
      throw new Error('No next step available from current stage');
    }

    // Clear future history if navigating forward from middle
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new stage and move forward
    this.history.push(navigation.workflow_next_step);
    this.currentIndex++;

    return {
      previous_stage: currentStatus,
      current_stage: navigation.workflow_next_step,
      navigation_info: this.getNavigationInfo(navigation.workflow_next_step, requestData),
      history: this.getHistory(),
    };
  }

  /**
   * Navigate back to a specific stage by name (primary method for "Send Back" feature)
   */
  navigateBackToStage(stageName: string, requestData: Record<string, any> = {}): NavigateBackResult {
    const targetIndex = this.findMostRecentStageIndex(stageName);

    if (targetIndex === -1) {
      throw new Error(`Stage "${stageName}" not found in history before current position`);
    }

    return this.navigateBackToIndex(targetIndex, requestData);
  }

  /**
   * Get stage names for dropdown (for "Send Back" feature)
   * This returns stages from actual navigation history
   */
  getPreviousStageNames(): string[] {
    return this.getAvailablePreviousStages().map(item => item.stage);
  }

  /**
   * Get all previous stages based on workflow structure (not history)
   * Returns all stages that come before the current stage in the workflow definition
   */
  getPreviousStageNamesByStructure(currentStageName: string): string[] {
    const currentStageIndex = this.workflowData.stages.findIndex(
      s => s.name === currentStageName
    );

    if (currentStageIndex === -1) {
      throw new Error(`Stage "${currentStageName}" not found in workflow`);
    }

    // Return all stages before the current stage
    return this.workflowData.stages
      .slice(0, currentStageIndex)
      .map(stage => stage.name);
  }

  /**
   * Get all previous stages with their indices
   */
  getAvailablePreviousStages(): PreviousStageItem[] {
    const available: PreviousStageItem[] = [];
    const seen = new Set<string>();

    for (let i = this.currentIndex - 1; i >= 0; i--) {
      const stage = this.history[i];
      if (!seen.has(stage)) {
        available.push({ stage, index: i });
        seen.add(stage);
      }
    }

    return available;
  }

  /**
   * Get full navigation history
   */
  getHistory(): NavigationHistory {
    return {
      history: [...this.history],
      current_index: this.currentIndex,
      current_stage: this.getCurrentStage(),
      can_go_back: this.currentIndex > 0,
      can_go_forward: this.currentIndex < this.history.length - 1,
    };
  }

  /**
   * Get all unique visited stages
   */
  getVisitedStages(): string[] {
    return [...new Set(this.history)];
  }

  /**
   * Get navigation info for a specific stage
   */
  getNavigationInfo(currentStatus: string, requestData: Record<string, any> = {}): NavigationInfo {
    const currentStage = this.findStageByName(currentStatus);
    const currentStageIndex = this.workflowData.stages.findIndex(s => s.name === currentStatus);

    return {
      workflow_next_step: this.findNextStep(currentStatus, currentStageIndex, requestData),
      workflow_previous_step: this.findPreviousStep(),
      available_previous_stages: this.getAvailablePreviousStages(),
      current_user_action: this.getActiveActions(currentStage),
      thirdNextStage: this.findThirdNextStage(currentStatus, currentStageIndex, requestData),
      next_stage_info: this.getNextStageInfo(currentStatus, currentStageIndex, requestData),
      current_stage_info: this.buildStageInfo(currentStage),
    };
  }

  getALLStageName(): string[] {
    return this.workflowData.stages.map(s => s.name);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Navigate back to a specific index
   */
  private navigateBackToIndex(historyIndex: number, requestData: Record<string, any> = {}): NavigateBackResult {
    if (historyIndex < 0 || historyIndex >= this.history.length) {
      throw new Error(`Invalid history index: ${historyIndex}`);
    }

    if (historyIndex >= this.currentIndex) {
      throw new Error('Cannot navigate back to current or future stage');
    }

    const previousStage = this.getCurrentStage();
    this.currentIndex = historyIndex;
    const currentStage = this.getCurrentStage();

    return {
      previous_stage: previousStage,
      current_stage: currentStage,
      navigation_info: this.getNavigationInfo(currentStage!, requestData),
      history: this.getHistory(),
    };
  }

  /**
   * Find the most recent occurrence of a stage before current position
   */
  private findMostRecentStageIndex(stageName: string): number {
    for (let i = this.currentIndex - 1; i >= 0; i--) {
      if (this.history[i] === stageName) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Find stage by name
   */
  private findStageByName(stageName: string): Stage {
    console.log('getPreviousStageNamesByStructure', this.workflowData);
    const stage = this.workflowData.stages.find(s => s.name === stageName);
    if (!stage) {
      throw new Error(`Stage "${stageName}" not found in workflow`);
    }
    return stage;
  }

  /**
   * Get active actions for a stage
   */
  private getActiveActions(stage: Stage): string[] {
    const actions: string[] = [];
    for (const [actionName, actionConfig] of Object.entries(stage.available_actions)) {
      if (actionConfig.is_active) {
        actions.push(actionName);
      }
    }
    return actions;
  }

  /**
   * Find next step based on routing rules
   */
  private findNextStep(currentStatus: string, currentStageIndex: number, requestData: Record<string, any>): string | null {
    // Check routing rules first
    const applicableRules = this.workflowData.routing_rules.filter(
      rule => rule.trigger_stage === currentStatus
    );

    for (const rule of applicableRules) {
      if (evaluateCondition(rule.condition, requestData) && rule.action.type === 'NEXT_STAGE') {
        return rule.action.parameters.target_stage;
      }
    }

    // Default to next sequential stage
    if (currentStageIndex < this.workflowData.stages.length - 1) {
      return this.workflowData.stages[currentStageIndex + 1].name;
    }

    return null;
  }

  /**
   * Find previous step from actual history
   */
  private findPreviousStep(): string | null {
    const availablePrevious = this.getAvailablePreviousStages();
    return availablePrevious.length > 0 ? availablePrevious[0].stage : null;
  }

  /**
   * Find third next stage (stage after next stage)
   */
  private findThirdNextStage(currentStatus: string, currentStageIndex: number, requestData: Record<string, any>): string | null {
    const nextStep = this.findNextStep(currentStatus, currentStageIndex, requestData);
    if (!nextStep) return null;

    const nextStageIndex = this.workflowData.stages.findIndex(s => s.name === nextStep);
    if (nextStageIndex === -1) return null;

    return this.findNextStep(nextStep, nextStageIndex, requestData);
  }

  /**
   * Get info for next stage
   */
  private getNextStageInfo(currentStatus: string, currentStageIndex: number, requestData: Record<string, any>): StageInfo | Record<string, never> {
    const nextStep = this.findNextStep(currentStatus, currentStageIndex, requestData);
    if (!nextStep) return {};

    const nextStage = this.workflowData.stages.find(s => s.name === nextStep);
    return nextStage ? this.buildStageInfo(nextStage) : {};
  }

  /**
   * Build stage info object
   */
  private buildStageInfo(stage: Stage): StageInfo {
    return {
      name: stage.name,
      sla: stage.sla,
      sla_unit: stage.sla_unit,
      assigned_users: stage.assigned_users,
      hide_fields: stage.hide_fields,
      is_hod: stage?.is_hod ?? null,
      role: stage?.role || '',
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Evaluate routing rule condition
 */
function evaluateCondition(condition: ConditionConfig, requestData: Record<string, any>): boolean {
  const { field, operator, value } = condition;
  const fieldValue = requestData[field];

  if (fieldValue === undefined || fieldValue === null) {
    return false;
  }

  const fieldValueStr = String(fieldValue);
  const numericValue = parseFloat(fieldValue);
  const compareValue = parseFloat(value[0]);

  switch (operator) {
    case 'eq':
      return value.includes(fieldValueStr);
    case 'lt':
      return numericValue < compareValue;
    case 'gt':
      return numericValue > compareValue;
    case 'lte':
      return numericValue <= compareValue;
    case 'gte':
      return numericValue >= compareValue;
    case 'in':
      return value.includes(fieldValueStr);
    case 'not_eq':
      return !value.includes(fieldValueStr);
    default:
      return false;
  }
}
