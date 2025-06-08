import React from 'react';
import { StepState, WizardStep, WizardStepData } from './sessionTypes';
import BasicInfoStep from '../../app/(app)/assessment/new/_components/steps/basic-info-step';
import RoleSelectionStep from '../../app/(app)/assessment/new/_components/steps/role-selection-step';
import AreasForImprovementStep from '../../app/(app)/assessment/new/_components/steps/areas-for-improvement-step';
import WorkVolumeComplexityStep from '../../app/(app)/assessment/new/_components/steps/work-volume-complexity-step';
import DataSystemsStep from '../../app/(app)/assessment/new/_components/steps/data-systems-step';
import ReadinessExpectationsStep from '../../app/(app)/assessment/new/_components/steps/readiness-expectations-step';
import RoiTargetsStep from '../../app/(app)/assessment/new/_components/steps/roi-targets-step';
import ReviewSubmitStep from '../../app/(app)/assessment/new/_components/steps/review-submit-step';

export interface WizardStepConfig {
  id: keyof WizardStepData;
  name: string;
  component: React.ComponentType<any>;
  step: WizardStep;
}

export const wizardStepMap: Record<WizardStep, WizardStepConfig> = {
  [WizardStep.ORGANIZATION_INFO]: {
    id: 'basics',
    name: 'Basic Information',
    component: BasicInfoStep,
    step: WizardStep.ORGANIZATION_INFO,
  },
  [WizardStep.ROLE_SELECTION]: {
    id: 'roleSelection',
    name: 'Role Selection',
    component: RoleSelectionStep,
    step: WizardStep.ROLE_SELECTION,
  },
  [WizardStep.AREAS_FOR_IMPROVEMENT]: {
    id: 'areasForImprovement',
    name: 'Areas for Improvement',
    component: AreasForImprovementStep,
    step: WizardStep.AREAS_FOR_IMPROVEMENT,
  },
  [WizardStep.WORK_VOLUME_COMPLEXITY]: {
    id: 'workVolume',
    name: 'Work Volume & Complexity',
    component: WorkVolumeComplexityStep,
    step: WizardStep.WORK_VOLUME_COMPLEXITY,
  },
  [WizardStep.DATA_SYSTEMS]: {
    id: 'dataSystems',
    name: 'Data & Systems',
    component: DataSystemsStep,
    step: WizardStep.DATA_SYSTEMS,
  },
  [WizardStep.READINESS_EXPECTATIONS]: {
    id: 'readiness',
    name: 'Readiness & Expectations',
    component: ReadinessExpectationsStep,
    step: WizardStep.READINESS_EXPECTATIONS,
  },
  [WizardStep.ROI_TARGETS]: {
    id: 'roiTargets',
    name: 'ROI Targets',
    component: RoiTargetsStep,
    step: WizardStep.ROI_TARGETS,
  },
  [WizardStep.REVIEW_SUBMIT]: {
    id: 'reviewSubmit',
    name: 'Review & Submit',
    component: ReviewSubmitStep,
    step: WizardStep.REVIEW_SUBMIT,
  },
};

export const initialSteps: StepState[] = Object.values(wizardStepMap).map(
  (config) => ({
    id: config.id,
    name: config.name,
    isCompleted: false,
    isValid: false,
    data: {
      basics: { name: '', industry: '', size: '', description: '' },
      roleSelection: { selectedRoles: [] },
      areasForImprovement: { selectedAreas: [] },
      workVolume: { taskVolume: 50, taskComplexity: 50 },
      dataSystems: { dataSources: [], softwareSystems: [] },
      readiness: { changeReadiness: 5, aiExpectations: 5 },
      roiTargets: { costSavings: 0, revenueGrowth: 0 },
      reviewSubmit: {},
    },
    errors: {},
  })
); 