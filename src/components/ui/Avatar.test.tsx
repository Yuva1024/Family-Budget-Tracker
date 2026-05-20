import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Avatar from './Avatar';

describe('Avatar', () => {
    it('renders single letter initial for one-word name', () => {
        render(<Avatar name="John" />);
        expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders two initials for two-word name', () => {
        render(<Avatar name="John Doe" />);
        expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders two initials for three-word name', () => {
        render(<Avatar name="John Doe Smith" />);
        expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('capitalizes initials correctly', () => {
        render(<Avatar name="john doe" />);
        expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('applies custom size prop correctly', () => {
        const { container } = render(<Avatar name="John Doe" size={64} />);
        const div = container.firstChild as HTMLElement;
        expect(div).toHaveStyle({ width: '64px', height: '64px', fontSize: '24.32px' });
    });

    it('applies custom className prop correctly', () => {
        const { container } = render(<Avatar name="John" className="custom-class" />);
        const div = container.firstChild as HTMLElement;
        expect(div).toHaveClass('custom-class');
    });

    it('renders image when url is provided', () => {
        const url = 'https://example.com/avatar.jpg';
        const { container } = render(<Avatar name="John Doe" url={url} />);
        const div = container.firstChild as HTMLElement;

        // Ensure initials are NOT in the document when url is provided
        expect(screen.queryByText('JD')).not.toBeInTheDocument();

        // Check if the background style is applied correctly
        expect(div.style.background).toContain(`url("${url}")`);
    });

    it('applies fallback background color based on name hash when url is not provided', () => {
        const { container } = render(<Avatar name="John Doe" />);
        const div = container.firstChild as HTMLElement;

        // JSDom converts hsl to rgb
        expect(div.style.background).toBe('rgb(190, 55, 75)');
    });
});
