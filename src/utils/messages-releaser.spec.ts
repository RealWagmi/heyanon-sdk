import { describe, expect, it } from 'vitest';

import { MessagesReleaser } from './messages-releaser';

describe('MessagesReleaser', () => {
    it('should initialize with default separator', () => {
        const releaser = new MessagesReleaser();
        expect(releaser.separator).toBe('\n');
    });

    it('should initialize with custom separator', () => {
        const releaser = new MessagesReleaser({ separator: ' ' });
        expect(releaser.separator).toBe(' ');
    });

    it('should add messages and release them with default separator', () => {
        const releaser = new MessagesReleaser();
        releaser.add('Message 1');
        releaser.add('Message 2');
        const result = releaser.release();
        expect(result).toBe('\nMessage 1\nMessage 2');
    });

    it('should add messages and release them with custom separator', () => {
        const releaser = new MessagesReleaser({ separator: ' ' });
        releaser.add('Message 1');
        releaser.add('Message 2');
        const result = releaser.release();
        expect(result).toBe(' Message 1 Message 2');
    });

    it('should release messages and reset the internal state', () => {
        const releaser = new MessagesReleaser();
        releaser.add('Message 1');
        releaser.add('Message 2');
        releaser.release();
        const result = releaser.release();
        expect(result).toBe('');
    });

    it('should add a last message during release', () => {
        const releaser = new MessagesReleaser();
        releaser.add('Message 1');
        const result = releaser.release('Message 2');
        expect(result).toBe('\nMessage 1\nMessage 2');
    });

    it('should reset messages after release', () => {
        const releaser = new MessagesReleaser();
        releaser.add('Message 1');
        releaser.release();
        expect(releaser.messages).toEqual([]);
    });

    it('should add multiple messages at once', () => {
        const releaser = new MessagesReleaser();
        releaser.add('Message 1', 'Message 2', 'Message 3');
        expect(releaser.messages).toEqual(['Message 1', 'Message 2', 'Message 3']);
    });
});
