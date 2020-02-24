import Router from '@koa/router';
import { BAD_REQUEST, OK } from 'http-status-codes';
import { getRepository } from 'typeorm';
import { ILogger } from '../../logger';
import { IUserSession, TaskSolution, TaskSolutionChecker, TaskSolutionResult } from '../../models';
import { createCrossCheckPairs } from '../../rules/distribution';
import { courseService, taskResultsService, taskService } from '../../services';
import { setErrorResponse, setResponse } from '../utils';

type Input = { url: string };

export const postTaskSolution = (_: ILogger) => async (ctx: Router.RouterContext) => {
  const { githubId, courseId, courseTaskId } = ctx.params;

  const [student, courseTask] = await Promise.all([
    courseService.queryStudentByGithubId(courseId, githubId),
    taskService.getCourseTask(courseTaskId),
  ]);

  if (student == null || courseTask == null) {
    setResponse(ctx, BAD_REQUEST, { message: 'not valid student or course task' });
    return;
  }

  const inputData: Input = ctx.request.body;
  const data = {
    url: inputData.url || undefined,
  };

  if (courseTask.checker !== 'crossCheck') {
    setResponse(ctx, BAD_REQUEST, { message: 'task solution is not supported for this task' });
    return;
  }

  const existingResult = await taskResultsService.getTaskSolution(student.id, courseTask.id);
  if (existingResult != null) {
    await getRepository(TaskSolution).save({ ...existingResult, ...data });
    setResponse(ctx, OK, {});
    return;
  }

  await getRepository(TaskSolution).save({ studentId: student.id, courseTaskId: courseTask.id, url: data.url });
  setResponse(ctx, OK, {});
};

export const createCrossCheckDistribution = (__: ILogger) => async (ctx: Router.RouterContext) => {
  const { courseTaskId } = ctx.params;
  const defaultPairsCount = 4;

  const courseTask = await taskService.getCourseTask(courseTaskId);
  if (courseTask == null) {
    setResponse(ctx, BAD_REQUEST);
    return;
  }

  const solutions = await courseService.getTaskSolutionsWithoutChecker(courseTaskId);
  const solutionsMap = new Map<number, number>();
  for (const solution of solutions) {
    solutionsMap.set(solution.studentId, solution.id);
  }

  const students = Array.from(solutionsMap.keys());
  const pairs = createCrossCheckPairs(students, courseTask.pairsCount ?? defaultPairsCount);

  const crossCheckPairs = pairs
    .filter(pair => solutionsMap.has(pair.studentId))
    .map(pair => ({
      ...pair,
      courseTaskId,
      taskSolutionId: solutionsMap.get(pair.studentId),
    }));

  await getRepository(TaskSolutionChecker).save(crossCheckPairs);
  setResponse(ctx, OK, { crossCheckPairs });
};

export const createCrossCheckResult = (_: ILogger) => async (ctx: Router.RouterContext) => {
  const { githubId, courseId, courseTaskId } = ctx.params;
  const { user } = ctx.state as { user: IUserSession };
  const [student, checker, courseTask] = await Promise.all([
    courseService.queryStudentByGithubId(courseId, githubId),
    courseService.queryStudentByGithubId(courseId, user.githubId),
    taskService.getCourseTask(courseTaskId),
  ]);

  if (student == null || courseTask == null || checker == null) {
    setErrorResponse(ctx, BAD_REQUEST, 'not valid student or course task');
    return;
  }
  if (courseTask.checker !== 'crossCheck') {
    setErrorResponse(ctx, BAD_REQUEST, 'task solution is supported for this task');
    return;
  }
  const taskChecker = await taskResultsService.getTaskSolutionChecker(student.id, checker.id, courseTaskId);
  if (taskChecker == null) {
    setErrorResponse(ctx, BAD_REQUEST, 'no assigned cross-check');
    return;
  }

  const inputData: { score: number; comment: string } = ctx.request.body;
  const data = { score: Number(inputData.score), comment: inputData.comment || '' };

  if (isNaN(data.score) || data.score < 0) {
    setErrorResponse(ctx, BAD_REQUEST, 'no score provided');
    return;
  }

  const historicalResult = { ...data, authorId: user.id, dateTime: Date.now() };
  const existingResult = await taskResultsService.getTaskSolutionResult(student.id, checker.id, courseTask.id);
  if (existingResult != null) {
    existingResult.historicalScores.push(historicalResult);
    await getRepository(TaskSolutionResult).update(existingResult.id, {
      ...data,
      historicalScores: existingResult.historicalScores,
    });
    setResponse(ctx, OK);
    return;
  }

  await getRepository(TaskSolutionResult).insert({
    studentId: taskChecker.studentId,
    checkerId: taskChecker.checkerId,
    courseTaskId: taskChecker.courseTaskId,
    historicalScores: [historicalResult],
    ...data,
  });
  setResponse(ctx, OK);
};

export const getCrossCheckResult = (_: ILogger) => async (ctx: Router.RouterContext) => {
  const { githubId, courseId, courseTaskId } = ctx.params;
  const { user } = ctx.state as { user: IUserSession };
  const [student, checker, courseTask] = await Promise.all([
    courseService.queryStudentByGithubId(courseId, githubId),
    courseService.queryStudentByGithubId(courseId, user.githubId),
    taskService.getCourseTask(courseTaskId),
  ]);

  if (student == null || courseTask == null || checker == null) {
    setErrorResponse(ctx, BAD_REQUEST, 'not valid student or course task');
    return;
  }
  if (courseTask.checker !== 'crossCheck') {
    setErrorResponse(ctx, BAD_REQUEST, 'task solution is supported for this task');
    return;
  }
  const taskChecker = await taskResultsService.getTaskSolutionChecker(student.id, checker.id, courseTaskId);
  if (taskChecker == null) {
    setErrorResponse(ctx, BAD_REQUEST, 'no assigned cross-check');
    return;
  }
  const existingResult = await taskResultsService.getTaskSolutionResult(
    taskChecker.studentId,
    taskChecker.checkerId,
    taskChecker.courseTaskId,
  );
  setResponse(ctx, OK, existingResult);
};

export const getTaskSolutionAssignments = (_: ILogger) => async (ctx: Router.RouterContext) => {
  const { githubId, courseId, courseTaskId } = ctx.params;
  const [student, courseTask] = await Promise.all([
    courseService.queryStudentByGithubId(courseId, githubId),
    taskService.getCourseTask(courseTaskId),
  ]);

  if (student == null || courseTask == null) {
    setResponse(ctx, BAD_REQUEST, { message: 'not valid student or course task' });
    return;
  }
  if (courseTask.checker !== 'crossCheck') {
    setResponse(ctx, BAD_REQUEST, { message: 'not supported task' });
    return;
  }
  const records = await taskResultsService.getTaskSolutionAssignments(student.id, courseTaskId);
  const result = records.map(r => ({
    student: courseService.convertToStudentBasic(r.student),
    url: r.taskSolution.url,
  }));
  setResponse(ctx, OK, result);
};

export const createCrossCheckCompletion = (__: ILogger) => async (ctx: Router.RouterContext) => {
  const { courseTaskId } = ctx.params;

  const courseTask = await taskService.getCourseTask(courseTaskId);
  if (courseTask == null) {
    setResponse(ctx, BAD_REQUEST);
    return;
  }
  const studentScores = await courseService.getTaskSolutionCheckers(courseTaskId, courseTask.pairsCount ?? 3);

  for (const studentScore of studentScores) {
    const data = { authorId: -1, comment: 'Cross-Check score', score: studentScore.score };
    await taskResultsService.saveScore(studentScore.studentId, courseTaskId, data);
  }
  setResponse(ctx, OK);
};

export const getCrossCheckFeedback = (_: ILogger) => async (ctx: Router.RouterContext) => {
  const { githubId, courseId, courseTaskId } = ctx.params;
  const [student, courseTask] = await Promise.all([
    courseService.queryStudentByGithubId(courseId, githubId),
    taskService.getCourseTask(courseTaskId),
  ]);

  if (student == null || courseTask == null) {
    setResponse(ctx, BAD_REQUEST, { message: 'not valid student or course task' });
    return;
  }
  if (courseTask.checker !== 'crossCheck') {
    setResponse(ctx, BAD_REQUEST, { message: 'not supported task' });
    return;
  }

  const feedback = await taskResultsService.getTaskSolutionFeedback(student.id, courseTaskId);
  const response = { url: feedback.url, comments: feedback.comments.map(({ comment }) => ({ comment })) };
  setResponse(ctx, OK, response);
};