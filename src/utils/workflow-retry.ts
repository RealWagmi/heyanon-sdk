/**
 * Custom error class for breaking workflow execution
 */
export class WorkflowBreakError extends Error {
    /**
     * The reason for breaking the workflow
     */
    public readonly breakReason: unknown;

    /**
     * Create a new WorkflowBreakError
     * @param breakReason Optional reason for breaking the workflow
     */
    constructor(breakReason?: unknown) {
        super('Workflow execution was interrupted');
        this.name = 'WorkflowBreakError';
        this.breakReason = breakReason;
    }
}

/**
 * Options for configuring a workflow action
 * @template T The type of the action's result
 */
export interface ActionOptions<T> {
    /**
     * Name of the action
     */
    name: string;

    /**
     * Number of retry attempts
     * @default 1
     */
    attempts?: number;

    /**
     * Delay between retries in milliseconds
     * @default 0
     */
    delayMs?: number;

    /**
     * Function to execute
     * @param context The workflow context
     * @returns Promise with the action's result
     */
    action: (context: WorkflowContext) => Promise<T>;

    /**
     * Optional function to execute before each retry
     * @param attempt Current attempt number (1-based)
     * @param error The error that triggered the retry
     * @param context The workflow context
     */
    onRetry?: (attempt: number, error: Error, context: WorkflowContext) => Promise<void>;

    /**
     * Optional function to execute when action succeeds
     * @param result The action's result
     * @param context The workflow context
     */
    onSuccess?: (attempt: number, result: T, context: WorkflowContext) => Promise<void>;

    /**
     * Optional function to execute when action fails
     * @param error The error that caused the failure
     * @param context The workflow context
     */
    onFailed?: (attempt: number, error: Error, context: WorkflowContext) => Promise<void>;
}

/**
 * Options for configuring a workflow
 */
export interface WorkflowOptions {
    /**
     * Number of retry attempts
     * @default 1
     */
    attempts?: number;

    /**
     * Delay between retries in milliseconds
     * @default 0
     */
    delayMs?: number;

    /**
     * Optional callback to execute when workflow is broken
     * @param reason The reason for breaking the workflow
     * @param context The workflow context
     */
    onBreak?: (reason: any, context: WorkflowContext) => Promise<void>;

    /**
     * Optional callback to execute when workflow is retried
     * @param error The error that caused the retry
     * @param context The workflow context
     */
    onRetry?: (error: Error, context: WorkflowContext) => Promise<void>;

    /**
     * Optional callback to execute when workflow completes successfully
     * @param context The workflow context
     */
    onSuccess?: (context: WorkflowContext) => Promise<void>;

    /**
     * Optional callback to execute when workflow fails
     * @param error The error that caused the failure
     * @param context The workflow context
     */
    onFailed?: (error: Error, context: WorkflowContext) => Promise<void>;
}

/**
 * Class representing a workflow action that can be executed with retry logic
 * @template T The type of the action's result
 */
export class WorkflowAction<T> {
    /**
     * Name of the action
     */
    private readonly name: string;

    /**
     * Current attempt number
     */
    private currentAttempt: number = 0;

    /**
     * Number of retry attempts
     */
    private attempts: number;

    /**
     * Delay between retries in milliseconds
     */
    private delayMs: number;

    /**
     * Function to execute
     */
    private readonly action: (context: WorkflowContext) => Promise<T>;

    /**
     * Optional function to execute before each retry
     */
    private readonly onRetry?: (attempt: number, error: Error, context: WorkflowContext) => Promise<void>;

    /**
     * Optional function to execute when action succeeds
     */
    private readonly onSuccess?: (attempt: number, result: T, context: WorkflowContext) => Promise<void>;

    /**
     * Optional function to execute when action fails
     */
    private readonly onFailed?: (attempt: number, error: Error, context: WorkflowContext) => Promise<void>;

    /**
     * Create a new WorkflowAction
     * @param options Action configuration
     */
    constructor(options: ActionOptions<T>) {
        this.name = options.name;
        this.action = options.action;
        this.attempts = options.attempts || 1;
        this.delayMs = options.delayMs || 0;
        this.onRetry = options.onRetry;
        this.onSuccess = options.onSuccess;
        this.onFailed = options.onFailed;
    }

    /**
     * Get the name of the action
     * @returns The name of the action
     */
    getName(): string {
        return this.name;
    }

    /**
     * Private retry method for action execution
     * @param fn The function to retry
     * @param context The workflow context
     * @returns Promise with the result of the function
     * @throws {Error} If all retry attempts fail
     */
    private async retry(fn: () => Promise<T>, context: WorkflowContext): Promise<T> {
        for (let attempt = 1; attempt <= this.attempts; attempt++) {
            try {
                this.currentAttempt = attempt;
                return (await fn()) as T;
            } catch (error) {
                // If it's a WorkflowBreakError, propagate it
                if (error instanceof WorkflowBreakError) {
                    throw error;
                }

                if (attempt < this.attempts && this.onRetry) {
                    try {
                        await this.onRetry(this.currentAttempt, error as Error, context);
                    } catch (error) {
                        if (error instanceof WorkflowBreakError) {
                            context.getWorkflow().break(context.getWorkflow().getBreakReason());
                        } else {
                            context.getWorkflow().break(error as Error);
                        }
                    }
                }

                if (attempt === this.attempts) {
                    throw error as Error;
                }

                // Wait before retrying
                if (this.delayMs >= 0) {
                    this.delayMs === 0 ? await new Promise(resolve => setImmediate(resolve, this.delayMs)) : await new Promise(resolve => setTimeout(resolve, this.delayMs));
                }
            }
        }

        throw new Error(`Failed to execute action ${this.name} after ${this.attempts} attempts`);
    }

    /**
     * Execute the action with retry logic
     * @param context The workflow context containing results from previous actions
     * @returns Promise with the result of the action
     * @throws {Error} If all retry attempts fail
     * @throws {WorkflowBreakError} If the workflow is broken
     */
    async execute(context: WorkflowContext): Promise<T> {
        try {
            return await this.retry(async () => {
                const result = await this.action(context);
                if (this.onSuccess) {
                    try {
                        await this.onSuccess(this.currentAttempt, result, context);
                    } catch (error) {
                        if (error instanceof WorkflowBreakError) {
                            context.getWorkflow().break(context.getWorkflow().getBreakReason());
                        } else {
                            context.getWorkflow().break(error as Error);
                        }
                    }
                }
                return result;
            }, context);
        } catch (error) {
            // If it's a WorkflowBreakError, propagate it
            if (error instanceof WorkflowBreakError) {
                throw error;
            }

            // Call onFailed callback if provided
            if (this.onFailed) {
                try {
                    await this.onFailed(this.currentAttempt, error as Error, context);
                } catch (error) {
                    if (error instanceof WorkflowBreakError) {
                        context.getWorkflow().break(context.getWorkflow().getBreakReason());
                    } else {
                        context.getWorkflow().break(error as Error);
                    }
                }
            }

            throw error;
        }
    }
}

/**
 * Context object passed to each action, containing results from previous actions
 */
export class WorkflowContext {
    /**
     * Results from previous actions, stored by name
     */
    private resultsByName: Map<string, any> = new Map();

    /**
     * Results from previous actions, stored by index
     */
    private resultsByIndex: any[] = [];

    /**
     * Reference to the workflow instance
     */
    private workflow: WorkflowRetry;

    /**
     * Current attempt number
     */
    private currentAttempt: number = 0;

    /**
     * Current action name
     */
    private currentActionName: string = '';

    /**
     * Create a new WorkflowContext
     * @param workflow The workflow instance
     */
    constructor(workflow: WorkflowRetry) {
        this.workflow = workflow;
    }

    /**
     * Get the current attempt number
     * @returns The current attempt number (1-based)
     */
    getAttempt(): number {
        return this.currentAttempt;
    }

    /**
     * Set the current attempt number
     * @param attempt The attempt number to set
     */
    setAttempt(attempt: number): void {
        this.currentAttempt = attempt;
    }

    /**
     * Get the current action name
     * @returns The name of the currently executed action
     */
    getActionName(): string {
        return this.currentActionName;
    }

    /**
     * Set the current action name
     * @param name The name of the action to set
     */
    setActionName(name: string): void {
        this.currentActionName = name;
    }

    /**
     * Get the result of a specific action by name
     * @param name The name of the action result to retrieve
     * @returns The result of the action with the specified name
     * @throws {Error} If no result is available with the specified name
     */
    getResultByName<T>(name: string): T {
        if (!this.resultsByName.has(name)) {
            throw new Error(`No result available with name "${name}"`);
        }
        return this.resultsByName.get(name) as T;
    }

    /**
     * Get all results from previous actions
     * @returns Array of all results
     */
    getAllResults(): any[] {
        return [...this.resultsByIndex];
    }

    /**
     * Add a result to the context
     * @param name The name of the action
     * @param result The result to add
     */
    addResult(name: string, result: any): void {
        this.resultsByName.set(name, result);
        this.resultsByIndex.push(result);
    }

    /**
     * Get the results by name
     * @returns Map of results by name
     */
    getResultsByName(): Map<string, any> {
        return this.resultsByName;
    }

    /**
     * Get the workflow instance
     * @returns The workflow instance
     */
    getWorkflow(): WorkflowRetry {
        return this.workflow;
    }
}

/**
 * Class representing the result of a workflow execution
 */
export class WorkflowResult {
    /**
     * Results from actions, stored by name
     */
    private readonly resultsByName: Map<string, any> = new Map();

    /**
     * Results from actions, stored by index
     */
    private readonly resultsByIndex: any[] = [];

    /**
     * Failures from actions, stored by action name and attempt number
     */
    private readonly failuresByAction: Map<string, Map<number, any>> = new Map();

    /**
     * Create a new WorkflowResult
     * @param results Array of results from actions
     * @param actionNames Array of action names corresponding to the results
     */
    constructor(results: any[] = [], actionNames: string[] = []) {
        // Store results by index
        this.resultsByIndex = [...results];

        // Store results by name
        actionNames.forEach((name, index) => {
            if (index < results.length) {
                this.resultsByName.set(name, results[index]);
            }
        });
    }

    /**
     * Add a result to the workflow result
     * @param name The name of the action
     * @param result The result to add
     */
    addResult(name: string, result: any): void {
        this.resultsByName.set(name, result);
        this.resultsByIndex.push(result);
    }

    /**
     * Add a failure to the workflow result
     * @param name The name of the action that failed
     * @param attempt The attempt number
     * @param reason The reason for the failure
     */
    addFailure(name: string, attempt: number, reason: any): void {
        if (!this.failuresByAction.has(name)) {
            this.failuresByAction.set(name, new Map());
        }

        this.failuresByAction.get(name)!.set(attempt, reason);
    }

    /**
     * Get all failures for a specific action
     * @param name The name of the action
     * @returns Map of attempt numbers to failure reasons
     */
    getFailuresByAction(name: string): Map<number, any> {
        return this.failuresByAction.get(name) || new Map();
    }

    /**
     * Get all failures across all actions
     * @returns Map of action names to maps of attempt numbers to failure reasons
     */
    getAllFailures(): Map<string, Map<number, any>> {
        return new Map(this.failuresByAction);
    }

    /**
     * Check if an action failed in a specific attempt
     * @param name The name of the action
     * @param attempt The attempt number
     * @returns True if the action failed in the specified attempt
     */
    hasFailure(name: string, attempt: number): boolean {
        return this.failuresByAction.has(name) && this.failuresByAction.get(name)!.has(attempt);
    }

    /**
     * Get the failure reason for an action in a specific attempt
     * @param name The name of the action
     * @param attempt The attempt number
     * @returns The failure reason or undefined if no failure occurred
     */
    getFailure(name: string, attempt: number): any {
        return this.failuresByAction.get(name)?.get(attempt);
    }

    /**
     * Get all attempts when an action failed
     * @param name The name of the action
     * @returns Array of attempt numbers
     */
    getFailureAttempts(name: string): number[] {
        if (!this.failuresByAction.has(name)) {
            return [];
        }

        return Array.from(this.failuresByAction.get(name)!.keys());
    }

    /**
     * Get all actions that failed
     * @returns Array of action names
     */
    getFailedActions(): string[] {
        return Array.from(this.failuresByAction.keys());
    }

    /**
     * Get all actions that failed with a specific reason
     * @param reason The failure reason to search for
     * @returns Array of action names
     */
    getActionsFailedWithReason(reason: any): string[] {
        const failedActions: string[] = [];

        this.failuresByAction.forEach((attemptFailures, name) => {
            attemptFailures.forEach(failureReason => {
                if (this.areReasonsEqual(failureReason, reason)) {
                    failedActions.push(name);
                }
            });
        });

        return [...new Set(failedActions)]; // Remove duplicates
    }

    /**
     * Compare two reasons for equality
     * @param reason1 First reason
     * @param reason2 Second reason
     * @returns True if the reasons are equal
     * @private
     */
    private areReasonsEqual(reason1: any, reason2: any): boolean {
        // If both are Error objects, compare their messages
        if (reason1 instanceof Error && reason2 instanceof Error) {
            return reason1.message === reason2.message;
        }

        // If both are strings, compare directly
        if (typeof reason1 === 'string' && typeof reason2 === 'string') {
            return reason1 === reason2;
        }

        // For other cases, use JSON.stringify for comparison
        try {
            return JSON.stringify(reason1) === JSON.stringify(reason2);
        } catch {
            return String(reason1) === String(reason2);
        }
    }

    /**
     * Get the result of a specific action by name
     * @param name The name of the action
     * @returns The result of the action with the specified name
     * @throws {Error} If no result is available with the specified name
     */
    getResult<T>(name: string): T {
        if (!this.resultsByName.has(name)) {
            throw new Error(`No result available with name "${name}"`);
        }
        return this.resultsByName.get(name) as T;
    }

    /**
     * Get the result of the last action in the workflow
     * @returns The result of the last action
     * @throws {Error} If no results are available
     */
    getLastActionResult<T>(): T {
        if (this.resultsByIndex.length === 0) {
            throw new Error('No results available');
        }
        return this.resultsByIndex[this.resultsByIndex.length - 1] as T;
    }

    /**
     * Get all results from the workflow
     * @returns Array of all results
     */
    getAllResults(): any[] {
        return [...this.resultsByIndex];
    }

    /**
     * Get the number of results
     * @returns The number of results
     */
    getResultCount(): number {
        return this.resultsByIndex.length;
    }
}

/**
 * Class for handling workflow retries with configurable attempts and delay
 */
export class WorkflowRetry {
    /**
     * List of actions to execute in the workflow
     */
    private readonly actions: WorkflowAction<any>[] = [];

    /**
     * Number of retry attempts
     */
    private readonly attempts: number;

    /**
     * Delay between retries in milliseconds
     */
    private readonly delayMs: number;

    /**
     * Flag indicating if the workflow was broken
     */
    private isBroken: boolean = false;

    /**
     * Reason for breaking the workflow
     */
    private breakReason: unknown;

    /**
     * Optional callback to execute when workflow is retried
     * @param error The error that caused the retry
     * @param context The workflow context
     */
    private readonly onRetry?: (error: Error, context: WorkflowContext) => Promise<void>;

    /**
     * Optional callback to execute when workflow is broken
     * @param reason The reason for breaking the workflow
     * @param context The workflow context
     */
    private readonly onBreak?: (reason: any, context: WorkflowContext) => Promise<void>;

    /**
     * Optional callback to execute when workflow completes successfully
     * @param context The workflow context
     */
    private readonly onSuccess?: (context: WorkflowContext) => Promise<void>;

    /**
     * Optional callback to execute when workflow fails
     * @param error The error that caused the failure
     * @param context The workflow context
     */
    private readonly onFailed?: (error: Error, context: WorkflowContext) => Promise<void>;

    /**
     * Create a new WorkflowRetry instance
     * @param options Configuration options for the workflow and actions
     */
    constructor(options: WorkflowOptions = {}) {
        this.attempts = options.attempts || 1;
        this.delayMs = options.delayMs || 0;
        this.onBreak = options.onBreak;
        this.onSuccess = options.onSuccess;
        this.onFailed = options.onFailed;
        this.onRetry = options.onRetry;
    }

    /**
     * Break the workflow execution with an error
     * @param reason Optional reason for breaking the workflow
     * @param customError Optional custom error to throw instead of WorkflowBreakError
     * @throws {WorkflowBreakError} Always throws to break the workflow
     */
    break(reason?: unknown): never {
        this.isBroken = true;
        this.breakReason = reason;
        throw new WorkflowBreakError();
    }

    /**
     * Check if the workflow was broken
     * @returns True if the workflow was broken
     */
    wasBroken(): boolean {
        return this.isBroken;
    }

    /**
     * Get the reason for breaking the workflow
     * @returns The reason for breaking the workflow
     */
    getBreakReason(): unknown {
        return this.breakReason;
    }

    /**
     * Add an action to the workflow
     * @param options Action options including the action function and retry configuration
     * @returns The WorkflowRetry instance for method chaining
     */
    addAction<T>(options: ActionOptions<T>): WorkflowRetry {
        const workflowAction = new WorkflowAction<T>(options);
        this.actions.push(workflowAction);
        return this;
    }

    /**
     * Private retry method for workflow execution
     * @param fn The function to retry
     * @param context The workflow context
     * @returns Promise with the result of the function
     * @throws {Error} If all retry attempts fail
     */
    private async retry<T>(fn: () => Promise<T>, context: WorkflowContext): Promise<T> {
        for (let attempt = 1; attempt <= this.attempts; attempt++) {
            try {
                context.setAttempt(attempt);
                return await fn();
            } catch (error) {
                // Don't retry if it's a WorkflowBreakError
                if (error instanceof WorkflowBreakError) {
                    throw error;
                }

                // Call onRetry callback if provided
                if (attempt < this.attempts && this.onRetry) {
                    try {
                        await this.onRetry(error as Error, context);
                    } catch (error) {
                        if (error instanceof WorkflowBreakError) {
                            this.break(this.breakReason);
                        } else {
                            this.break(error as Error);
                        }
                    }
                }

                if (attempt === this.attempts) {
                    throw error as Error;
                }

                // Wait before retrying
                if (this.delayMs >= 0) {
                    this.delayMs === 0 ? await new Promise(resolve => setImmediate(resolve, this.delayMs)) : await new Promise(resolve => setTimeout(resolve, this.delayMs));
                }
            }
        }

        throw new Error(`Failed to execute workflow after ${this.attempts} attempts`);
    }

    /**
     * Execute all actions in the workflow with retry logic
     * @returns Promise with a WorkflowResult object containing the results
     * @throws {Error} If any action fails after all retry attempts
     * @throws {WorkflowBreakError} If the workflow is broken
     */
    async execute(): Promise<WorkflowResult> {
        const context = new WorkflowContext(this);
        this.isBroken = false; // Reset broken state at the start of execution
        try {
            return await this.retry(async () => {
                const workflowResult = new WorkflowResult();

                for (const action of this.actions) {
                    context.setActionName(action.getName());
                    const actionResult = await action.execute(context);
                    workflowResult.addResult(action.getName(), actionResult);
                    context.addResult(action.getName(), actionResult);
                }

                if (this.onSuccess) {
                    try {
                        await this.onSuccess(context);
                    } catch (error) {
                        if (error instanceof WorkflowBreakError) {
                            this.break(this.breakReason);
                        } else {
                            this.break(error as Error);
                        }
                    }
                }

                return workflowResult;
            }, context);
        } catch (error) {
            if (this.onBreak && error instanceof WorkflowBreakError) {
                try {
                    await this.onBreak(this.breakReason, context);
                } catch (error) {
                    if (error instanceof WorkflowBreakError && this.breakReason instanceof Error) {
                        throw this.breakReason;
                    }
                    throw error;
                }
            }
            if (error instanceof WorkflowBreakError && this.breakReason instanceof Error) {
                throw this.breakReason;
            }

            if (this.onFailed && !(error instanceof WorkflowBreakError)) {
                try {
                    await this.onFailed(error as Error, context);
                } catch (error) {
                    if (error instanceof WorkflowBreakError && this.breakReason instanceof Error) {
                        throw this.breakReason;
                    }
                    throw error;
                }
            }
            throw error;
        }
    }
}
