export interface AiToolProps {
    readonly name: string;
    readonly [key: string]: unknown;
}

export interface AiTool {
    readonly name: string;
    readonly description: string;
    readonly required: string[];
    readonly props: AiToolProps[];
    readonly strict?: boolean;
    readonly additionalProperties?: boolean;
}
