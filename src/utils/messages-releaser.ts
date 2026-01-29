export type MessagesReleaserOptions = {
    separator?: string;
};

export class MessagesReleaser {
    private _messages: string[] = [];
    private _separator = '\n';

    constructor(opts: MessagesReleaserOptions = {}) {
        if (opts?.separator) {
            this._separator = opts.separator;
        }
    }

    public get separator(): string {
        return this._separator;
    }

    public get messages(): string[] {
        return this._messages;
    }

    public release(lastMessage?: string): string {
        if (lastMessage) {
            this.add(lastMessage);
        }
        const message: string = this._messages.length > 0 ? this._separator.concat(this._messages.join(this._separator)) : '';
        this.reset();
        return message;
    }

    public add(...msgs: string[]): void {
        this._messages.push(...msgs);
    }

    private reset(): void {
        this._messages = [];
    }
}
