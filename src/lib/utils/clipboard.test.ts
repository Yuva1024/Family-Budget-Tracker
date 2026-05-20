import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
    // Save original globals
    const originalNavigator = global.navigator;
    const originalIsSecureContext = global.isSecureContext;
    const originalExecCommand = document.execCommand;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Mock window.isSecureContext
        Object.defineProperty(window, 'isSecureContext', {
            value: true,
            writable: true,
        });

        // Mock document.execCommand
        document.execCommand = vi.fn().mockReturnValue(true);

        // Spy on console warnings/errors to keep test output clean
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore globals
        vi.restoreAllMocks();
        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            writable: true,
        });
        Object.defineProperty(window, 'isSecureContext', {
            value: originalIsSecureContext,
            writable: true,
        });
        document.execCommand = originalExecCommand;

        // Clean up any remaining textareas just in case
        document.body.innerHTML = '';
    });

    it('returns false immediately if text is empty', async () => {
        const result = await copyToClipboard('');
        expect(result).toBe(false);
    });

    describe('when using modern navigator.clipboard API', () => {
        beforeEach(() => {
            Object.defineProperty(global, 'navigator', {
                value: {
                    clipboard: {
                        writeText: vi.fn().mockResolvedValue(undefined),
                    },
                },
                writable: true,
            });
        });

        it('successfully copies text using navigator.clipboard', async () => {
            const result = await copyToClipboard('test text');

            expect(result).toBe(true);
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
            expect(document.execCommand).not.toHaveBeenCalled();
        });

        it('falls back to execCommand if navigator.clipboard throws an error', async () => {
            // Mock navigator.clipboard to throw
            navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Clipboard error'));

            const result = await copyToClipboard('test text');

            expect(result).toBe(true); // Since fallback succeeds
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
            expect(console.warn).toHaveBeenCalledWith('Navigator clipboard failed, using fallback.', expect.any(Error));
            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });
    });

    describe('when using fallback execCommand API', () => {
        beforeEach(() => {
            // Remove navigator.clipboard to force fallback
            Object.defineProperty(global, 'navigator', {
                value: {},
                writable: true,
            });
        });

        it('successfully copies text using execCommand when navigator.clipboard is missing', async () => {
            const result = await copyToClipboard('test text');

            expect(result).toBe(true);
            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });

        it('successfully copies text using execCommand when window is not secure context', async () => {
            // Restore navigator.clipboard but make context insecure
            Object.defineProperty(global, 'navigator', {
                value: {
                    clipboard: {
                        writeText: vi.fn(),
                    },
                },
                writable: true,
            });
            window.isSecureContext = false;

            const result = await copyToClipboard('test text');

            expect(result).toBe(true);
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });

        it('creates a hidden textarea, selects its text, and removes it', async () => {
            // Spy on document methods
            const createElementSpy = vi.spyOn(document, 'createElement');
            const appendChildSpy = vi.spyOn(document.body, 'appendChild');
            const removeChildSpy = vi.spyOn(document.body, 'removeChild');

            await copyToClipboard('test text');

            // Verify element creation
            expect(createElementSpy).toHaveBeenCalledWith('textarea');

            // Verify the created element was appended
            const textArea = appendChildSpy.mock.calls[0][0] as HTMLTextAreaElement;
            expect(textArea.tagName.toLowerCase()).toBe('textarea');
            expect(textArea.value).toBe('test text');
            expect(textArea.style.position).toBe('fixed');
            expect(textArea.style.opacity).toBe('0');

            // Verify execCommand was called
            expect(document.execCommand).toHaveBeenCalledWith('copy');

            // Verify element was removed
            expect(removeChildSpy).toHaveBeenCalledWith(textArea);
        });

        it('returns false and logs error if execCommand throws', async () => {
            document.execCommand = vi.fn().mockImplementation(() => {
                throw new Error('Exec command error');
            });

            const result = await copyToClipboard('test text');

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Fallback clipboard failed', expect.any(Error));
        });
    });
});
