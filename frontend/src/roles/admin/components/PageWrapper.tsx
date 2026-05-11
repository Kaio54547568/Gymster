import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  backgroundImage?: string;
}

export default function PageWrapper({ children, backgroundImage }: PageWrapperProps) {
  return (
    <div className="min-h-full relative">
      {/* Cinematic Background */}
      {backgroundImage && (
        <>
          <div className="fixed inset-0 pointer-events-none">
            <img
              src={backgroundImage}
              alt="Background"
              className="w-full h-full object-cover opacity-[0.03]"
            />
          </div>
          <div className="fixed inset-0 bg-gradient-to-br from-[#EF233C]/5 via-transparent to-[#990000]/5 pointer-events-none" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
