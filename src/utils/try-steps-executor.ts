import { MessagesReleaser } from './messages-releaser';

export type ExecuteFn<T> = () => Promise<T>;
export type OnSuccessFn = () => Promise<void>;
export type OnFailureFn = (message: string) => Promise<void>;

export type StepOpts<R> = {
    executeFn: ExecuteFn<R>;
    onSuccessMessage: string;
    onFailureFn: OnFailureFn;
};

export class TryStepsExecutor {
    private msgsReleaser: MessagesReleaser;
    private onFailureFn: OnFailureFn;

    constructor(initialReleaser: MessagesReleaser, initialOnFailureFn: OnFailureFn) {
        this.msgsReleaser = initialReleaser || new MessagesReleaser();
        this.onFailureFn = initialOnFailureFn;
    }

    public async executeStep<ER, FR>(executeFn: ExecuteFn<ER>, onSuccessMessage: string, onFailureMessage: string): Promise<ER | FR> {
        try {
            const result: ER = await executeFn();
            this.msgsReleaser.add(onSuccessMessage);
            return result;
        } catch (error) {
            await this.onFailureFn(onFailureMessage);
            throw error;
        }
    }
}
