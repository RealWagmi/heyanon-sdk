import { describe, expect, it, vi } from 'vitest';
import { WorkflowBreakError, WorkflowContext, WorkflowResult, WorkflowRetry } from './workflow-retry';

describe('WorkflowRetry', () => {
    describe('Basic Workflow Execution', () => {
        it('should execute a single action successfully', async () => {
            const workflow = new WorkflowRetry();
            const mockAction = vi.fn().mockResolvedValue('result');

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            const result = await workflow.execute();
            expect(result).toBeInstanceOf(WorkflowResult);
            expect(result.getResult('testAction')).toBe('result');
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should execute multiple actions in sequence', async () => {
            const workflow = new WorkflowRetry();
            const action1 = vi.fn().mockResolvedValue('result1');
            const action2 = vi.fn().mockResolvedValue('result2');

            workflow.addAction({
                name: 'action1',
                action: action1,
            });
            workflow.addAction({
                name: 'action2',
                action: action2,
            });

            const result = await workflow.execute();
            expect(result.getResult('action1')).toBe('result1');
            expect(result.getResult('action2')).toBe('result2');
            expect(action1).toHaveBeenCalledTimes(1);
            expect(action2).toHaveBeenCalledTimes(1);
        });

        it('should pass context between actions', async () => {
            const workflow = new WorkflowRetry();
            const action1 = vi.fn().mockImplementation((context: WorkflowContext) => {
                context.addResult('shared', 'data');
                return 'result1';
            });
            const action2 = vi.fn().mockImplementation((context: WorkflowContext) => {
                const sharedData = context.getResultByName('shared');
                return `result2 with ${sharedData}`;
            });

            workflow.addAction({
                name: 'action1',
                action: action1,
            });
            workflow.addAction({
                name: 'action2',
                action: action2,
            });

            const result = await workflow.execute();
            expect(result.getResult('action2')).toBe('result2 with data');
        });

        it('should handle empty workflow', async () => {
            const workflow = new WorkflowRetry();
            const result = await workflow.execute();
            expect(result).toBeInstanceOf(WorkflowResult);
            expect(result.getAllResults()).toEqual([]);
        });
    });

    describe('Retry Mechanism', () => {
        it('should retry failed actions', async () => {
            const workflow = new WorkflowRetry({
                attempts: 3,
                delayMs: 0,
            });

            let attempts = 0;
            const mockAction = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Action failed');
                }
                return 'success';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            const result = await workflow.execute();
            expect(result.getResult('testAction')).toBe('success');
            expect(mockAction).toHaveBeenCalledTimes(3);
        });

        it('should handle errors in onRetry callback', async () => {
            const workflow = new WorkflowRetry({
                attempts: 3,
                delayMs: 0,
            });

            const action = vi.fn().mockRejectedValue(new Error('Action failed'));
            const onRetry = vi.fn().mockImplementation(async (attempt: number) => {
                if (attempt === 2) {
                    throw new Error('onRetry error');
                }
            });

            workflow.addAction({
                name: 'testAction',
                action,
                attempts: 3,
                delayMs: 0,
                onRetry,
            });

            await expect(workflow.execute()).rejects.toThrow('onRetry error');
            expect(action).toHaveBeenCalledTimes(2);
            expect(onRetry).toHaveBeenCalledTimes(2);
        });

        it('should break workflow when onRetry throws an error', async () => {
            const workflow = new WorkflowRetry({
                attempts: 2,
                delayMs: 0,
            });

            const mockAction = vi.fn().mockImplementation(() => {
                throw new Error('First attempt failed');
            });

            const onRetry = vi.fn().mockImplementation(() => {
                throw new Error('onRetry error');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                attempts: 2,
                delayMs: 0,
                onRetry,
            });

            await expect(workflow.execute()).rejects.toThrow('onRetry error');
            expect(mockAction).toHaveBeenCalledTimes(1);
            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('should respect delay between retries', async () => {
            const workflow = new WorkflowRetry({
                attempts: 2,
                delayMs: 100,
            });

            let attempts = 0;

            const mockAction = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts === 1) {
                    throw new Error('First attempt failed');
                }
                return 'result';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            const startTime = Date.now();
            await workflow.execute();
            const endTime = Date.now();

            expect(endTime - startTime).toBeGreaterThanOrEqual(100);
            expect(mockAction).toHaveBeenCalledTimes(2);
        });

        it('should use action-specific retry options', async () => {
            const workflow = new WorkflowRetry({
                attempts: 1,
                delayMs: 0,
            });

            let attempts = 0;
            const mockAction = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Action failed');
                }
                return 'success';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                attempts: 3,
                delayMs: 0,
            });

            const result = await workflow.execute();
            expect(result.getResult('testAction')).toBe('success');
            expect(mockAction).toHaveBeenCalledTimes(3);
        });

        it('should use workflow-level retry options', async () => {
            const workflow = new WorkflowRetry({
                attempts: 3,
                delayMs: 0,
            });

            let attempts = 0;
            const mockAction = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Action failed');
                }
                return 'success';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            const result = await workflow.execute();
            expect(result.getResult('testAction')).toBe('success');
            expect(mockAction).toHaveBeenCalledTimes(3);
        });
    });

    describe('Workflow Break', () => {
        it('should break workflow execution with default error', async () => {
            const workflow = new WorkflowRetry();
            const mockAction = vi.fn().mockImplementation(() => {
                workflow.break();
            });

            workflow.addAction({
                name: 'action1',
                action: mockAction,
            });

            await expect(workflow.execute()).rejects.toThrow('Workflow execution was interrupted');
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should break workflow execution with custom error', async () => {
            const workflow = new WorkflowRetry();
            const error = new Error('Custom break error');
            const mockAction = vi.fn().mockImplementation(() => {
                workflow.break(error);
            });

            workflow.addAction({
                name: 'action1',
                action: mockAction,
            });

            await expect(workflow.execute()).rejects.toThrow('Custom break error');
            expect(workflow.wasBroken()).toBe(true);
            expect(workflow.getBreakReason()).toBe(error);
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should not retry on WorkflowBreakError', async () => {
            const workflow = new WorkflowRetry();
            const onRetry = vi.fn();
            const mockAction = vi.fn().mockImplementation(() => {
                workflow.break();
            });

            workflow.addAction({
                name: 'action1',
                attempts: 3,
                delayMs: 0,
                action: mockAction,
                onRetry,
            });

            await expect(workflow.execute()).rejects.toThrow('Workflow execution was interrupted');
            expect(mockAction).toHaveBeenCalledTimes(1);
            expect(onRetry).not.toHaveBeenCalled();
        });

        it('should call onBreak callback when workflow is broken', async () => {
            const onBreakMock = vi.fn().mockResolvedValue(Promise.resolve());
            const workflow = new WorkflowRetry({
                onBreak: onBreakMock,
            });
            const breakReason = new Error('Custom break reason');

            workflow.addAction({
                name: 'testAction',
                action: async () => {
                    workflow.break(breakReason);
                    return 'result';
                },
            });

            await expect(workflow.execute()).rejects.toThrow('Custom break reason');
            expect(onBreakMock).toHaveBeenCalledWith(breakReason, expect.any(WorkflowContext));
        });

        it('should call onBreak callback with default reason when no reason is provided', async () => {
            const onBreak = vi.fn().mockResolvedValue(Promise.resolve());
            const workflow = new WorkflowRetry({ onBreak });
            const mockAction = vi.fn().mockImplementation(() => {
                workflow.break();
            });

            workflow.addAction({
                name: 'action1',
                action: mockAction,
            });

            await expect(workflow.execute()).rejects.toThrow('Workflow execution was interrupted');
            expect(workflow.getBreakReason()).toBeUndefined();
            expect(mockAction).toHaveBeenCalledTimes(1);
            expect(onBreak).toHaveBeenCalledWith(undefined, expect.any(WorkflowContext));
        });

        it('should break workflow from action onRetry callback', async () => {
            const workflow = new WorkflowRetry({
                attempts: 3,
                delayMs: 0,
            });

            const onRetry = vi.fn().mockImplementation(() => {
                workflow.break('Break from action onRetry');
            });

            const mockAction = vi.fn().mockImplementation(() => {
                throw new Error('Action failed');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                attempts: 3,
                delayMs: 0,
                onRetry,
            });

            try {
                await workflow.execute();
                expect.fail('Expected execute to throw WorkflowBreakError');
            } catch (error) {
                expect(error).toBeInstanceOf(WorkflowBreakError);
                expect(workflow.getBreakReason()).toBe('Break from action onRetry');
                expect(onRetry).toHaveBeenCalledTimes(1);
                expect(mockAction).toHaveBeenCalledTimes(1);
            }
        });
    });

    describe('Callbacks', () => {
        it('should call onSuccess callback when workflow completes', async () => {
            const onSuccessMock = vi.fn();
            const workflow = new WorkflowRetry({
                onSuccess: onSuccessMock,
            });

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockResolvedValue('result'),
            });

            await workflow.execute();
            expect(onSuccessMock).toHaveBeenCalledWith(expect.any(WorkflowContext));
        });

        it('should call onFailed callback when workflow fails', async () => {
            const onFailedMock = vi.fn();
            const workflow = new WorkflowRetry({
                onFailed: onFailedMock,
            });

            const error = new Error('Action failed');
            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockRejectedValue(error),
            });

            await expect(workflow.execute()).rejects.toThrow('Action failed');
            expect(onFailedMock).toHaveBeenCalledWith(error, expect.any(WorkflowContext));
        });

        it('should call action-specific onSuccess callback', async () => {
            const onSuccessMock = vi.fn();
            const workflow = new WorkflowRetry();

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockResolvedValue('result'),
                onSuccess: onSuccessMock,
            });

            await workflow.execute();
            expect(onSuccessMock).toHaveBeenCalledWith(1, 'result', expect.any(WorkflowContext));
        });

        it('should call action-specific onFailed callback', async () => {
            const onFailedMock = vi.fn();
            const workflow = new WorkflowRetry();

            const error = new Error('Action failed');
            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockRejectedValue(error),
                onFailed: onFailedMock,
            });

            await expect(workflow.execute()).rejects.toThrow('Action failed');
            expect(onFailedMock).toHaveBeenCalledWith(1, error, expect.any(WorkflowContext));
        });

        it('should call onRetry callback before each retry', async () => {
            const onRetryMock = vi.fn();
            const workflow = new WorkflowRetry({
                attempts: 3,
                delayMs: 0,
                onRetry: onRetryMock,
            });

            let attempts = 0;
            const mockAction = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Action failed');
                }
                return 'success';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            await workflow.execute();
            expect(onRetryMock).toHaveBeenCalledTimes(2);
        });

        it('should break workflow if onSuccess callback throws', async () => {
            const onSuccessError = new Error('onSuccess error');
            const workflow = new WorkflowRetry();

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockResolvedValue('result'),
                onSuccess: vi.fn().mockRejectedValue(onSuccessError),
            });

            await expect(workflow.execute()).rejects.toThrow('onSuccess error');
        });

        it('should break workflow if onFailed callback throws', async () => {
            const onFailedError = new Error('onFailed error');
            const workflow = new WorkflowRetry();

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockRejectedValue(new Error('Action failed')),
                onFailed: vi.fn().mockRejectedValue(onFailedError),
            });

            await expect(workflow.execute()).rejects.toThrow('onFailed error');
        });
    });

    describe('Workflow Context', () => {
        it('should maintain context between retries', async () => {
            const workflow = new WorkflowRetry({
                attempts: 2,
                delayMs: 0,
            });

            let attempts = 0;
            const mockAction = vi.fn().mockImplementation((context: WorkflowContext) => {
                attempts++;
                if (attempts === 1) {
                    context.addResult('attempt', attempts);
                    throw new Error('First attempt failed');
                }
                const previousAttempt = context.getResultByName<number>('attempt');
                return `Success on attempt ${previousAttempt + 1}`;
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            const result = await workflow.execute();
            expect(result.getResult('testAction')).toBe('Success on attempt 2');
        });

        it('should handle missing results gracefully', async () => {
            const workflow = new WorkflowRetry();
            const mockAction = vi.fn().mockImplementation((context: WorkflowContext) => {
                expect(() => context.getResultByName('nonexistent')).toThrow('No result available with name "nonexistent"');
                return 'result';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            await workflow.execute();
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should track current attempt number', async () => {
            const workflow = new WorkflowRetry({
                attempts: 3,
                delayMs: 0,
            });

            const attemptNumbers: number[] = [];
            const mockAction = vi.fn().mockImplementation((context: WorkflowContext) => {
                attemptNumbers.push(context.getAttempt());
                if (context.getAttempt() < 3) {
                    throw new Error('Action failed');
                }
                return 'success';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            await workflow.execute();
            expect(attemptNumbers).toEqual([1, 2, 3]);
        });

        it('should share context between actions', async () => {
            const workflow = new WorkflowRetry();
            const action1 = vi.fn().mockImplementation((context: WorkflowContext) => {
                context.addResult('shared', 'data');
                return 'result1';
            });
            const action2 = vi.fn().mockImplementation((context: WorkflowContext) => {
                const sharedData = context.getResultByName('shared');
                return `result2 with ${sharedData}`;
            });
            const action3 = vi.fn().mockImplementation((context: WorkflowContext) => {
                const sharedData = context.getResultByName('shared');
                return `result3 with ${sharedData}`;
            });

            workflow.addAction({
                name: 'action1',
                action: action1,
            });
            workflow.addAction({
                name: 'action2',
                action: action2,
            });
            workflow.addAction({
                name: 'action3',
                action: action3,
            });

            const result = await workflow.execute();
            expect(result.getResult('action2')).toBe('result2 with data');
            expect(result.getResult('action3')).toBe('result3 with data');
        });
    });

    describe('Workflow Result', () => {
        it('should store results by name and index', async () => {
            const workflow = new WorkflowRetry();

            workflow.addAction({
                name: 'action1',
                action: vi.fn().mockResolvedValue('result1'),
            });
            workflow.addAction({
                name: 'action2',
                action: vi.fn().mockResolvedValue('result2'),
            });

            const result = await workflow.execute();
            expect(result.getResult('action1')).toBe('result1');
            expect(result.getResult('action2')).toBe('result2');
            expect(result.getAllResults()).toEqual(['result1', 'result2']);
        });

        it('should handle duplicate action names', async () => {
            const workflow = new WorkflowRetry();

            workflow.addAction({
                name: 'sameName',
                action: vi.fn().mockResolvedValue('result1'),
            });
            workflow.addAction({
                name: 'sameName',
                action: vi.fn().mockResolvedValue('result2'),
            });

            const result = await workflow.execute();
            expect(result.getResult('sameName')).toBe('result2');
            expect(result.getAllResults()).toEqual(['result1', 'result2']);
        });

        it('should throw error when accessing non-existent result', async () => {
            const workflow = new WorkflowRetry();

            workflow.addAction({
                name: 'action1',
                action: vi.fn().mockResolvedValue('result1'),
            });

            const result = await workflow.execute();
            expect(() => result.getResult('nonexistent')).toThrow('No result available with name "nonexistent"');
        });

        it('should handle complex result types', async () => {
            const workflow = new WorkflowRetry();
            const complexResult = { id: 1, data: { name: 'test', values: [1, 2, 3] } };

            workflow.addAction({
                name: 'complexAction',
                action: vi.fn().mockResolvedValue(complexResult),
            });

            const result = await workflow.execute();
            expect(result.getResult('complexAction')).toEqual(complexResult);
        });
    });

    describe('Error Handling', () => {
        it('should propagate errors from actions', async () => {
            const workflow = new WorkflowRetry();
            const error = new Error('Action error');

            workflow.addAction({
                name: 'errorAction',
                action: vi.fn().mockRejectedValue(error),
            });

            await expect(workflow.execute()).rejects.toThrow('Action error');
        });

        it('should handle errors in multiple actions', async () => {
            const workflow = new WorkflowRetry();
            const error1 = new Error('First action error');
            const error2 = new Error('Second action error');

            workflow.addAction({
                name: 'action1',
                action: vi.fn().mockRejectedValue(error1),
            });
            workflow.addAction({
                name: 'action2',
                action: vi.fn().mockRejectedValue(error2),
            });

            await expect(workflow.execute()).rejects.toThrow('First action error');
        });

        it('should handle errors in onSuccess callback', async () => {
            const workflow = new WorkflowRetry();
            const error = new Error('onSuccess error');

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockResolvedValue('result'),
                onSuccess: vi.fn().mockRejectedValue(error),
            });

            await expect(workflow.execute()).rejects.toThrow('onSuccess error');
        });

        it('should handle errors in onFailed callback', async () => {
            const workflow = new WorkflowRetry();
            const actionError = new Error('Action error');
            const callbackError = new Error('onFailed error');

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockRejectedValue(actionError),
                onFailed: vi.fn().mockRejectedValue(callbackError),
            });

            await expect(workflow.execute()).rejects.toThrow('onFailed error');
        });

        it('should handle errors in onRetry callback', async () => {
            const workflow = new WorkflowRetry({
                attempts: 2,
                delayMs: 0,
            });

            const onRetryError = new Error('onRetry error');
            const onRetry = vi.fn().mockRejectedValue(onRetryError);

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockRejectedValue(new Error('Action error')),
                attempts: 2,
                delayMs: 0,
                onRetry,
            });

            await expect(workflow.execute()).rejects.toThrow('onRetry error');
        });

        it('should handle custom errors in workflow-level onSuccess callback', async () => {
            const customError = new Error('Custom workflow onSuccess error');
            const onSuccess = vi.fn().mockRejectedValue(customError);

            const workflow = new WorkflowRetry({
                onSuccess,
            });

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockResolvedValue('result'),
            });

            await expect(workflow.execute()).rejects.toThrow('Custom workflow onSuccess error');
        });

        it('should handle custom errors in workflow-level onFailed callback', async () => {
            const customError = new Error('Custom workflow onFailed error');
            const onFailed = vi.fn().mockRejectedValue(customError);

            const workflow = new WorkflowRetry({
                onFailed,
            });

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockRejectedValue(new Error('Action error')),
            });

            await expect(workflow.execute()).rejects.toThrow('Custom workflow onFailed error');
        });

        it('should handle custom errors in workflow-level onRetry callback', async () => {
            const customError = new Error('Custom workflow onRetry error');
            const onRetry = vi.fn().mockRejectedValue(customError);

            const workflow = new WorkflowRetry({
                attempts: 2,
                delayMs: 0,
                onRetry,
            });

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockRejectedValue(new Error('Action error')),
            });

            await expect(workflow.execute()).rejects.toThrow('Custom workflow onRetry error');
        });

        it('should handle custom errors in workflow-level onBreak callback', async () => {
            const customError = new Error('Custom workflow onBreak error');
            const onBreak = vi.fn().mockRejectedValue(customError);

            const workflow = new WorkflowRetry({
                onBreak,
            });

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockImplementation(() => {
                    workflow.break('Initial break');
                    return 'result';
                }),
            });

            await expect(workflow.execute()).rejects.toThrow('Custom workflow onBreak error');
        });

        it('should handle custom errors in action-level onSuccess callback', async () => {
            const workflow = new WorkflowRetry();
            const customError = new Error('Custom action onSuccess error');

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockResolvedValue('result'),
                onSuccess: vi.fn().mockRejectedValue(customError),
            });

            await expect(workflow.execute()).rejects.toThrow('Custom action onSuccess error');
        });

        it('should handle custom errors in action-level onFailed callback', async () => {
            const workflow = new WorkflowRetry();
            const customError = new Error('Custom action onFailed error');

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockRejectedValue(new Error('Action error')),
                onFailed: vi.fn().mockRejectedValue(customError),
            });

            await expect(workflow.execute()).rejects.toThrow('Custom action onFailed error');
        });

        it('should handle custom errors in action-level onRetry callback', async () => {
            const workflow = new WorkflowRetry({
                attempts: 2,
                delayMs: 0,
            });

            const customError = new Error('Custom action onRetry error');

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockRejectedValue(new Error('Action error')),
                attempts: 2,
                delayMs: 0,
                onRetry: vi.fn().mockRejectedValue(customError),
            });

            await expect(workflow.execute()).rejects.toThrow('Custom action onRetry error');
        });

        it('should handle complex custom error objects in callbacks', async () => {
            const workflow = new WorkflowRetry();
            const customError = {
                code: 'CUSTOM_ERROR',
                message: 'Complex custom error',
                details: {
                    reason: 'Test failure',
                    timestamp: new Date().toISOString(),
                },
            };

            workflow.addAction({
                name: 'testAction',
                action: vi.fn().mockResolvedValue('result'),
                onSuccess: vi.fn().mockImplementation(() => {
                    throw customError;
                }),
            });

            await expect(workflow.execute()).rejects.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero retry attempts', async () => {
            const workflow = new WorkflowRetry({
                attempts: 0,
                delayMs: 0,
            });

            const mockAction = vi.fn().mockRejectedValue(new Error('Action failed'));

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            await expect(workflow.execute()).rejects.toThrow('Action failed');
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should handle negative delay', async () => {
            const workflow = new WorkflowRetry({
                attempts: 2,
                delayMs: -100,
            });

            let attempts = 0;
            const mockAction = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts === 1) {
                    throw new Error('First attempt failed');
                }
                return 'result';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            const result = await workflow.execute();
            expect(result.getResult('testAction')).toBe('result');
            expect(mockAction).toHaveBeenCalledTimes(2);
        });

        it('should handle very large number of retries', async () => {
            const workflow = new WorkflowRetry({
                attempts: 100,
                delayMs: 0,
            });

            let attempts = 0;
            const mockAction = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 100) {
                    throw new Error('Action failed');
                }
                return 'success';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            const result = await workflow.execute();
            expect(result.getResult('testAction')).toBe('success');
            expect(mockAction).toHaveBeenCalledTimes(100);
        });

        it('should handle very long delay', async () => {
            const workflow = new WorkflowRetry({
                attempts: 2,
                delayMs: 1000,
            });

            let attempts = 0;
            const mockAction = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts === 1) {
                    throw new Error('First attempt failed');
                }
                return 'result';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            const startTime = Date.now();
            await workflow.execute();
            const endTime = Date.now();

            expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
            expect(mockAction).toHaveBeenCalledTimes(2);
        });

        it('should handle undefined action name', async () => {
            const workflow = new WorkflowRetry();

            workflow.addAction({
                name: '',
                action: vi.fn().mockResolvedValue('result'),
            });

            const result = await workflow.execute();
            expect(() => result.getResult('undefined')).toThrow('No result available with name "undefined"');
        });
    });

    describe('Breaking from callbacks', () => {
        it('should break workflow from workflow onRetry callback', async () => {
            const onRetry = vi.fn().mockImplementation(() => {
                workflow.break('Break from workflow onRetry');
            });

            const workflow = new WorkflowRetry({
                attempts: 3,
                delayMs: 0,
                onRetry,
            });

            const mockAction = vi.fn().mockImplementation(() => {
                throw new Error('Action failed');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            try {
                await workflow.execute();
                expect.fail('Expected execute to throw WorkflowBreakError');
            } catch (error) {
                expect(error).toBeInstanceOf(WorkflowBreakError);
                expect(workflow.getBreakReason()).toBe('Break from workflow onRetry');
                expect(onRetry).toHaveBeenCalledTimes(1);
                expect(mockAction).toHaveBeenCalledTimes(1);
            }
        });

        it('should break workflow from action onRetry callback', async () => {
            const workflow = new WorkflowRetry({
                attempts: 3,
                delayMs: 0,
            });

            const onRetry = vi.fn().mockImplementation(() => {
                workflow.break('Break from action onRetry');
            });

            const mockAction = vi.fn().mockImplementation(() => {
                throw new Error('Action failed');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                attempts: 3,
                delayMs: 0,
                onRetry,
            });

            try {
                await workflow.execute();
                expect.fail('Expected execute to throw WorkflowBreakError');
            } catch (error) {
                expect(error).toBeInstanceOf(WorkflowBreakError);
                expect(workflow.getBreakReason()).toBe('Break from action onRetry');
                expect(onRetry).toHaveBeenCalledTimes(1);
                expect(mockAction).toHaveBeenCalledTimes(1);
            }
        });

        it('should break workflow from workflow onBreak callback', async () => {
            const onBreak = vi.fn().mockImplementation(() => {
                workflow.break('Break from workflow onBreak');
            });

            const workflow = new WorkflowRetry({
                onBreak,
            });

            const mockAction = vi.fn().mockImplementation(() => {
                workflow.break('Initial break');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            try {
                await workflow.execute();
                expect.fail('Expected execute to throw WorkflowBreakError');
            } catch (error) {
                expect(error).toBeInstanceOf(WorkflowBreakError);
                expect(workflow.getBreakReason()).toBe('Break from workflow onBreak');
                expect(onBreak).toHaveBeenCalledTimes(1);
                expect(mockAction).toHaveBeenCalledTimes(1);
            }
        });

        it('should break workflow from workflow onSuccess callback', async () => {
            const onSuccess = vi.fn().mockImplementation(() => {
                workflow.break('Break from workflow onSuccess');
            });

            const workflow = new WorkflowRetry({
                onSuccess,
            });

            const mockAction = vi.fn().mockImplementation(() => {
                return 'result';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            try {
                await workflow.execute();
                expect.fail('Expected execute to throw WorkflowBreakError');
            } catch (error) {
                expect(error).toBeInstanceOf(WorkflowBreakError);
                expect(workflow.getBreakReason()).toBe('Break from workflow onSuccess');
                expect(onSuccess).toHaveBeenCalledTimes(1);
                expect(mockAction).toHaveBeenCalledTimes(1);
            }
        });

        it('should break workflow from action onSuccess callback', async () => {
            const workflow = new WorkflowRetry();

            const onSuccess = vi.fn().mockImplementation(() => {
                workflow.break('Break from action onSuccess');
            });

            const mockAction = vi.fn().mockImplementation(() => {
                return 'result';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                onSuccess,
            });

            try {
                await workflow.execute();
                expect.fail('Expected execute to throw WorkflowBreakError');
            } catch (error) {
                expect(error).toBeInstanceOf(WorkflowBreakError);
                expect(workflow.getBreakReason()).toBe('Break from action onSuccess');
                expect(onSuccess).toHaveBeenCalledTimes(1);
                expect(mockAction).toHaveBeenCalledTimes(1);
            }
        });

        it('should break workflow from workflow onFailed callback', async () => {
            const onFailed = vi.fn().mockImplementation(() => {
                workflow.break('Break from workflow onFailed');
            });

            const workflow = new WorkflowRetry({
                onFailed,
            });

            const mockAction = vi.fn().mockImplementation(() => {
                throw new Error('Action failed');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            try {
                await workflow.execute();
                expect.fail('Expected execute to throw WorkflowBreakError');
            } catch (error) {
                expect(error).toBeInstanceOf(WorkflowBreakError);
                expect(workflow.getBreakReason()).toBe('Break from workflow onFailed');
                expect(onFailed).toHaveBeenCalledTimes(1);
                expect(mockAction).toHaveBeenCalledTimes(1);
            }
        });

        it('should break workflow from action onFailed callback', async () => {
            const workflow = new WorkflowRetry();

            const onFailed = vi.fn().mockImplementation(() => {
                workflow.break('Break from action onFailed');
            });

            const mockAction = vi.fn().mockImplementation(() => {
                throw new Error('Action failed');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                onFailed,
            });

            try {
                await workflow.execute();
                expect.fail('Expected execute to throw WorkflowBreakError');
            } catch (error) {
                expect(error).toBeInstanceOf(WorkflowBreakError);
                expect(workflow.getBreakReason()).toBe('Break from action onFailed');
                expect(onFailed).toHaveBeenCalledTimes(1);
                expect(mockAction).toHaveBeenCalledTimes(1);
            }
        });

        it('should handle nested breaks from callbacks', async () => {
            const onBreak = vi.fn().mockImplementation(() => {
                workflow.break('Break from onBreak');
            });

            const onSuccess = vi.fn().mockImplementation(() => {
                workflow.break('Break from onSuccess');
            });

            const workflow = new WorkflowRetry({
                onBreak,
            });

            const mockAction = vi.fn().mockImplementation(() => {
                return 'result';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                onSuccess,
            });

            try {
                await workflow.execute();
                expect.fail('Expected execute to throw WorkflowBreakError');
            } catch (error) {
                expect(error).toBeInstanceOf(WorkflowBreakError);
                // The last break reason should be the one that's stored
                expect(workflow.getBreakReason()).toBe('Break from onBreak');
                expect(onSuccess).toHaveBeenCalledTimes(1);
                expect(onBreak).toHaveBeenCalledTimes(1);
                expect(mockAction).toHaveBeenCalledTimes(1);
            }
        });
    });

    describe('Breaking with custom errors from callbacks', () => {
        it('should break workflow with custom error from workflow onRetry callback', async () => {
            const customError = new Error('Custom error from workflow onRetry');
            const onRetry = vi.fn().mockImplementation(() => {
                workflow.break(customError);
            });

            const workflow = new WorkflowRetry({
                attempts: 3,
                delayMs: 0,
                onRetry,
            });

            const mockAction = vi.fn().mockImplementation(() => {
                throw new Error('Action failed');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            await expect(workflow.execute()).rejects.toThrow('Custom error from workflow onRetry');
            expect(workflow.getBreakReason()).toBe(customError);
            expect(onRetry).toHaveBeenCalledTimes(1);
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should break workflow with custom error from action onRetry callback', async () => {
            const workflow = new WorkflowRetry({
                attempts: 3,
                delayMs: 0,
            });

            const customError = new Error('Custom error from action onRetry');
            const onRetry = vi.fn().mockImplementation(() => {
                workflow.break(customError);
            });

            const mockAction = vi.fn().mockImplementation(() => {
                throw new Error('Action failed');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                attempts: 3,
                delayMs: 0,
                onRetry,
            });

            await expect(workflow.execute()).rejects.toThrow('Custom error from action onRetry');
            expect(workflow.getBreakReason()).toBe(customError);
            expect(onRetry).toHaveBeenCalledTimes(1);
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should break workflow with custom error from workflow onBreak callback', async () => {
            const customError = new Error('Custom error from workflow onBreak');
            const onBreak = vi.fn().mockImplementation(() => {
                workflow.break(customError);
            });

            const workflow = new WorkflowRetry({
                onBreak,
            });

            const mockAction = vi.fn().mockImplementation(() => {
                workflow.break('Initial break');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            await expect(workflow.execute()).rejects.toThrow('Custom error from workflow onBreak');
            expect(workflow.getBreakReason()).toBe(customError);
            expect(onBreak).toHaveBeenCalledTimes(1);
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should break workflow with custom error from workflow onSuccess callback', async () => {
            const customError = new Error('Custom error from workflow onSuccess');
            const onSuccess = vi.fn().mockImplementation(() => {
                workflow.break(customError);
            });

            const workflow = new WorkflowRetry({
                onSuccess,
            });

            const mockAction = vi.fn().mockImplementation(() => {
                return 'result';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            await expect(workflow.execute()).rejects.toThrow('Custom error from workflow onSuccess');
            expect(workflow.getBreakReason()).toBe(customError);
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should break workflow with custom error from action onSuccess callback', async () => {
            const workflow = new WorkflowRetry();

            const customError = new Error('Custom error from action onSuccess');
            const onSuccess = vi.fn().mockImplementation(() => {
                workflow.break(customError);
            });

            const mockAction = vi.fn().mockImplementation(() => {
                return 'result';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                onSuccess,
            });

            await expect(workflow.execute()).rejects.toThrow('Custom error from action onSuccess');
            expect(workflow.getBreakReason()).toBe(customError);
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should break workflow with custom error from workflow onFailed callback', async () => {
            const customError = new Error('Custom error from workflow onFailed');
            const onFailed = vi.fn().mockImplementation(() => {
                workflow.break(customError);
            });

            const workflow = new WorkflowRetry({
                onFailed,
            });

            const mockAction = vi.fn().mockImplementation(() => {
                throw new Error('Action failed');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
            });

            await expect(workflow.execute()).rejects.toThrow('Custom error from workflow onFailed');
            expect(workflow.getBreakReason()).toBe(customError);
            expect(onFailed).toHaveBeenCalledTimes(1);
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should break workflow with custom error from action onFailed callback', async () => {
            const workflow = new WorkflowRetry();

            const customError = new Error('Custom error from action onFailed');
            const onFailed = vi.fn().mockImplementation(() => {
                workflow.break(customError);
            });

            const mockAction = vi.fn().mockImplementation(() => {
                throw new Error('Action failed');
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                onFailed,
            });

            await expect(workflow.execute()).rejects.toThrow('Custom error from action onFailed');
            expect(workflow.getBreakReason()).toBe(customError);
            expect(onFailed).toHaveBeenCalledTimes(1);
            expect(mockAction).toHaveBeenCalledTimes(1);
        });

        it('should handle complex custom error objects', async () => {
            const workflow = new WorkflowRetry();

            const customError = {
                code: 'CUSTOM_ERROR',
                message: 'Complex custom error',
                details: {
                    reason: 'Test failure',
                    timestamp: new Date().toISOString(),
                },
            };

            const onSuccess = vi.fn().mockImplementation(() => {
                workflow.break(customError);
            });

            const mockAction = vi.fn().mockImplementation(() => {
                return 'result';
            });

            workflow.addAction({
                name: 'testAction',
                action: mockAction,
                onSuccess,
            });

            await expect(workflow.execute()).rejects.toThrow('Workflow execution was interrupted');
            expect(workflow.getBreakReason()).toBe(customError);
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(mockAction).toHaveBeenCalledTimes(1);
        });
    });
});
