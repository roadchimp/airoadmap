'use client';

import React, { useState } from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { WizardStep } from '@/lib/session/sessionTypes';
import QuestionCard from '@/app/(app)/assessment/new/_components/QuestionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, FileText, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ReviewSubmitStep = () => {
  const { session, setStepData } = useSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [reportStatus, setReportStatus] = useState<'generating' | 'completed' | null>(null);

  // Function to poll report status
  const pollForReportStatus = async (assessmentId: number) => {
    const maxAttempts = 30; // Poll for up to 15 minutes (30 * 30s)
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/assessments/${assessmentId}/report-status`);
        if (response.ok) {
          const status = await response.json();
          setReportStatus(status.status);
          
          if (status.status === 'completed') {
            setSubmissionResult(prev => ({ ...prev, reportId: status.reportId }));
            toast({
              title: "Report Ready!",
              description: "Your AI transformation report has been generated successfully.",
            });
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 30000); // Poll every 30 seconds
        } else {
          toast({
            title: "Report Generation Taking Longer",
            description: "Report generation is taking longer than expected. Please check your assessments dashboard.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error polling report status:', error);
      }
    };
    
    setTimeout(poll, 5000); // Start polling after 5 seconds
  };

  const basicsData = session.steps[WizardStep.ORGANIZATION_INFO]?.data.basics || {};
  const roleSelectionData = session.steps[WizardStep.ROLE_SELECTION]?.data.roleSelection || {};
  const areasData = session.steps[WizardStep.AREAS_FOR_IMPROVEMENT]?.data.areasForImprovement || {};
  const workVolumeData = session.steps[WizardStep.WORK_VOLUME_COMPLEXITY]?.data.workVolume || {};
  const dataSystemsData = session.steps[WizardStep.DATA_SYSTEMS]?.data.dataSystems || {};
  const readinessData = session.steps[WizardStep.READINESS_EXPECTATIONS]?.data.readiness || {};
  const roiData = session.steps[WizardStep.ROI_TARGETS]?.data.roiTargets || {};



  const handleBasicsChange = (field: string, value: any) => {
    setStepData(WizardStep.ORGANIZATION_INFO, {
      basics: {
        ...basicsData,
        [field]: value
      }
    }, true);
  };

  const handleRoiChange = (field: string, value: any) => {
    setStepData(WizardStep.ROI_TARGETS, {
      roiTargets: {
        ...roiData,
        [field]: value
      }
    }, true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Get CSRF token first
      const csrfResponse = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }
      
      const { token: csrfToken } = await csrfResponse.json();

      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(session),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit assessment');
      }

      const result = await response.json();
      setSubmissionResult(result);
      setSuccess(true);
      
      // Start polling for report status if report generation is in progress
      if (result.reportGenerating) {
        pollForReportStatus(result.assessmentId);
      }
      
      toast({
        title: "Success!",
        description: result.reportGenerating 
          ? 'Assessment submitted successfully. Report generation started in background.' 
          : 'Assessment submitted successfully.',
      });
      
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    const hasReport = submissionResult?.reportId;
    
    return (
      <QuestionCard title="Submission Complete">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-green-600">Thank You!</h2>
            <p className="mt-2 text-gray-700">Your assessment has been submitted successfully.</p>
          </div>

          {reportStatus === 'completed' || hasReport ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Report Ready!</span>
              </div>
              <p className="text-green-700 text-sm mb-4">
                Your AI transformation report has been generated successfully.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = `/reports/${submissionResult.reportId}`}
                  className="w-full"
                >
                  View Report <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/assessment'}
                  className="w-full"
                >
                  Return to Assessments
                </Button>
              </div>
            </div>
          ) : submissionResult?.reportGenerating ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="text-blue-800 font-medium">Report Generation in Progress</span>
              </div>
              <p className="text-blue-700 text-sm mb-4">
                Your AI transformation report is being generated. This process typically takes 5-10 minutes.
              </p>
              <p className="text-blue-600 text-sm mb-4">
                We're checking the status automatically. You'll be notified once your report is ready.
              </p>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/assessment'}
                  className="w-full"
                >
                  Return to Assessments
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-orange-800 font-medium">Processing Your Assessment</span>
              </div>
              <p className="text-orange-700 text-sm mb-4">
                Your assessment is being processed. Report generation will begin shortly.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/assessment'}
                className="w-full"
              >
                Return to Assessments
              </Button>
            </div>
          )}
        </div>
      </QuestionCard>
    );
  }

  return (
    <QuestionCard
      title="Review & Submit"
      description="Review and edit your assessment details before submission."
    >
      <div className="space-y-8">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Organization Name</Label>
                <Input 
                  value={basicsData.name || ''} 
                  onChange={(e) => handleBasicsChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label>Assessment Name</Label>
                <Input 
                  value={basicsData.reportName || ''} 
                  onChange={(e) => handleBasicsChange('reportName', e.target.value)}
                />
              </div>
              <div>
                <Label>Industry</Label>
                <Input value={basicsData.industry || ''} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Organization Size</Label>
                <Input value={basicsData.size || ''} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Industry Maturity</Label>
                <Select 
                  value={basicsData.industryMaturity || ''} 
                  onValueChange={(value) => handleBasicsChange('industryMaturity', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mature">Mature</SelectItem>
                    <SelectItem value="Immature">Immature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Stage</Label>
                <Select 
                  value={basicsData.companyStage || ''} 
                  onValueChange={(value) => handleBasicsChange('companyStage', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Startup">Startup</SelectItem>
                    <SelectItem value="Early Growth">Early Growth</SelectItem>
                    <SelectItem value="Scaling">Scaling</SelectItem>
                    <SelectItem value="Mature">Mature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Strategic Focus Areas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {basicsData.strategicFocus?.map((focus, index) => (
                  <Badge key={index} variant="secondary">{focus}</Badge>
                )) || <span className="text-gray-500">None selected</span>}
              </div>
            </div>
            <div>
              <Label>Key Stakeholders</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {basicsData.keyStakeholders?.map((stakeholder, index) => (
                  <Badge key={index} variant="outline">{stakeholder}</Badge>
                )) || <span className="text-gray-500">None selected</span>}
              </div>
            </div>
            <div>
              <Label>Key Business Goals for AI</Label>
              <Textarea 
                value={basicsData.keyBusinessGoals || ''} 
                onChange={(e) => handleBasicsChange('keyBusinessGoals', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Selected Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Selected Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Roles included in this assessment.</p>
            <div className="flex flex-wrap gap-2">
              {roleSelectionData.selectedRoles?.map((role, index) => (
                <Badge key={index} variant="secondary">
                  {role.title} {role.level && `(${role.level})`}
                </Badge>
              )) || <span className="text-gray-500">No roles selected</span>}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              To change selected roles, please navigate back to the 'Role Selection' step.
            </p>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roleSelectionData.selectedRoles?.map((role) => {
              const painPoint = areasData.roleSpecificPainPoints?.[role.id];
              return painPoint ? (
                <div key={role.id} className="border-l-4 border-blue-200 pl-4">
                  <h4 className="font-medium text-gray-900">{role.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label className="text-sm">Severity (1-5)</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        value={painPoint.severity || ''} 
                        readOnly 
                        className="bg-gray-50" 
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Frequency (1-5)</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        value={painPoint.frequency || ''} 
                        readOnly 
                        className="bg-gray-50" 
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Impact (1-5)</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        value={painPoint.impact || ''} 
                        readOnly 
                        className="bg-gray-50" 
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label className="text-sm">Description</Label>
                    <Textarea 
                      value={painPoint.description || ''} 
                      readOnly 
                      className="bg-gray-50" 
                      rows={2}
                    />
                  </div>
                </div>
              ) : null;
            })}
            
            {areasData.generalPainPoints && (
              <div>
                <Label>General Organizational Pain Points</Label>
                <Textarea 
                  value={areasData.generalPainPoints} 
                  readOnly 
                  className="bg-gray-50 mt-2" 
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Volume & Complexity */}
        <Card>
          <CardHeader>
            <CardTitle>Work Volume & Complexity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roleSelectionData.selectedRoles?.map((role) => {
              const workData = workVolumeData.roleWorkVolume?.[role.id];
              return workData ? (
                <div key={role.id} className="border-l-4 border-green-200 pl-4">
                  <h4 className="font-medium text-gray-900">{role.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label className="text-sm">Task Volume</Label>
                      <Input value={workData.volume || ''} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm">Task Complexity</Label>
                      <Input value={workData.complexity || ''} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm">Repetitiveness (1-5)</Label>
                      <Input 
                        type="number" 
                        value={workData.repetitiveness || ''} 
                        readOnly 
                        className="bg-gray-50" 
                      />
                    </div>
                  </div>
                  {workData.notes && (
                    <div className="mt-2">
                      <Label className="text-sm">Notes</Label>
                      <Textarea 
                        value={workData.notes} 
                        readOnly 
                        className="bg-gray-50" 
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              ) : null;
            })}
          </CardContent>
        </Card>

        {/* Data & Systems */}
        <Card>
          <CardHeader>
            <CardTitle>Data & Systems</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data Accessibility</Label>
                <Input value={dataSystemsData.dataAccessibility || ''} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Data Quality</Label>
                <Input value={dataSystemsData.dataQuality || ''} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Systems Integration</Label>
                <Input value={dataSystemsData.systemsIntegration || ''} readOnly className="bg-gray-50" />
              </div>
            </div>
            <div>
              <Label>Relevant Tools & Platforms</Label>
              <Textarea 
                value={dataSystemsData.relevantTools || ''} 
                readOnly 
                className="bg-gray-50 mt-2" 
                rows={3}
              />
            </div>
            {dataSystemsData.notes && (
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={dataSystemsData.notes} 
                  readOnly 
                  className="bg-gray-50 mt-2" 
                  rows={2}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Readiness & Expectations */}
        <Card>
          <CardHeader>
            <CardTitle>Readiness & Expectations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Organizational Readiness</Label>
                <Input value={readinessData.organizationalReadiness || ''} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Stakeholder Alignment</Label>
                <Input value={readinessData.stakeholderAlignment || ''} readOnly className="bg-gray-50" />
              </div>
            </div>
            <div>
              <Label>Anticipated Training Needs</Label>
              <Textarea 
                value={readinessData.anticipatedTrainingNeeds || ''} 
                readOnly 
                className="bg-gray-50 mt-2" 
                rows={3}
              />
            </div>
            <div>
              <Label>Expected Adoption Challenges</Label>
              <Textarea 
                value={readinessData.expectedAdoptionChallenges || ''} 
                readOnly 
                className="bg-gray-50 mt-2" 
                rows={3}
              />
            </div>
            <div>
              <Label>Key Success Metrics</Label>
              <Textarea 
                value={readinessData.keySuccessMetrics || ''} 
                readOnly 
                className="bg-gray-50 mt-2" 
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* ROI Targets */}
        <Card>
          <CardHeader>
            <CardTitle>ROI Targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Adoption Rate Forecast (%)</Label>
                <Input 
                  type="number"
                  value={roiData.adoptionRateForecast || ''} 
                  onChange={(e) => handleRoiChange('adoptionRateForecast', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Time Savings (hours/week/user)</Label>
                <Input 
                  type="number"
                  value={roiData.timeSavings || ''} 
                  onChange={(e) => handleRoiChange('timeSavings', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Affected Users (count)</Label>
                <Input 
                  type="number"
                  value={roiData.affectedUsers || ''} 
                  onChange={(e) => handleRoiChange('affectedUsers', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Cost Efficiency Gains ($)</Label>
                <Input 
                  type="number"
                  value={roiData.costEfficiencyGains || ''} 
                  onChange={(e) => handleRoiChange('costEfficiencyGains', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Performance Improvement (%)</Label>
                <Input 
                  type="number"
                  value={roiData.performanceImprovement || ''} 
                  onChange={(e) => handleRoiChange('performanceImprovement', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Tool Sprawl Reduction (1-5)</Label>
                <Select 
                  value={roiData.toolSprawlReduction ? String(roiData.toolSprawlReduction) : ''} 
                  onValueChange={(value) => handleRoiChange('toolSprawlReduction', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Minimal</SelectItem>
                    <SelectItem value="2">2 - Below Average</SelectItem>
                    <SelectItem value="3">3 - Average</SelectItem>
                    <SelectItem value="4">4 - Above Average</SelectItem>
                    <SelectItem value="5">5 - Significant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 font-medium">Error: {error}</p>
          </div>
        )}

        <div className="flex justify-end pt-6">
          <Button onClick={handleSubmit} size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Assessment...
              </>
            ) : (
              'Submit Assessment'
            )}
          </Button>
        </div>
      </div>
    </QuestionCard>
  );
};

export default ReviewSubmitStep; 