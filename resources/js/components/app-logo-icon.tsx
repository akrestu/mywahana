import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    className,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/logo.png"
            alt="MyWahana"
            className={className}
            {...props}
        />
    );
}
