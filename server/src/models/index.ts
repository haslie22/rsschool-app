import { Certificate } from './certificate';
import { Course } from './course';
import { CourseEvent } from './courseEvent';
import { CourseManager } from './courseManager';
import { CourseTask } from './courseTask';
import { CourseUser } from './courseUser';
import { Event } from './event';
import { Feedback } from './feedback';
import { Mentor } from './mentor';
import { MentorRegistry } from './mentorRegistry';
import { PrivateFeedback } from './privateFeedback';
import { ProfilePermissions } from './profilePermissions';
import { Registry } from './registry';
import { Stage } from './stage';
import { StageInterview } from './stageInterview';
import { StageInterviewFeedback } from './stageInterviewFeedback';
import { StageInterviewStudent } from './stageInterviewStudent';
import { Student } from './student';
import { StudentFeedback } from './studentFeedback';
import { Task } from './task';
import { TaskArtefact } from './taskArtefact';
import { TaskChecker } from './taskChecker';
import { TaskInterviewResult } from './taskInterviewResult';
import { TaskResult } from './taskResult';
import { TaskSolution } from './taskSolution';
import { TaskSolutionChecker } from './taskSolutionChecker';
import { TaskSolutionResult } from './taskSolutionResult';
import { TaskVerification } from './taskVerification';
import { ExternalAccount, User } from './user';
import { Consent } from './consent';

export * from './session';
export {
  Certificate,
  Course,
  CourseEvent,
  CourseManager,
  CourseTask,
  CourseUser,
  Event,
  ExternalAccount,
  Feedback,
  Mentor,
  MentorRegistry,
  PrivateFeedback,
  ProfilePermissions,
  Registry,
  Stage,
  StageInterview,
  StageInterviewFeedback,
  StageInterviewStudent,
  Student,
  StudentFeedback,
  Task,
  TaskArtefact,
  TaskChecker,
  TaskInterviewResult,
  TaskResult,
  TaskSolution,
  TaskSolutionChecker,
  TaskSolutionResult,
  TaskVerification,
  User,
  Consent,
};

export const models = [
  Certificate,
  Course,
  CourseEvent,
  CourseManager,
  CourseTask,
  CourseUser,
  Event,
  Feedback,
  Mentor,
  MentorRegistry,
  PrivateFeedback,
  ProfilePermissions,
  Registry,
  Stage,
  StageInterview,
  StageInterviewFeedback,
  StageInterviewStudent,
  Student,
  StudentFeedback,
  Task,
  TaskArtefact,
  TaskChecker,
  TaskInterviewResult,
  TaskResult,
  TaskSolution,
  TaskSolutionChecker,
  TaskSolutionResult,
  TaskVerification,
  User,
  Consent,
];

export interface IApiResponse<T> {
  data: T | T[] | null;
  error?: {
    message: string;
  };
}
