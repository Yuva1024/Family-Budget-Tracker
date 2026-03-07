/**
 * Safely copies text to the clipboard.
 * Uses the modern navigator.clipboard API if available (secure context),
 * and falls back to document.execCommand('copy') for better compatibility
 * on mobile devices or non-HTTPS local networks.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    if (!text) return false;

    // Try modern async clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn('Navigator clipboard failed, using fallback.', err);
        }
    }

    // Fallback using execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Make text area invisible
    textArea.style.position = 'fixed';
    textArea.style.top = '-999999px';
    textArea.style.left = '-999999px';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error('Fallback clipboard failed', err);
        document.body.removeChild(textArea);
        return false;
    }
}
