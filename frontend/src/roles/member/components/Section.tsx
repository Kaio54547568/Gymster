import type { ReactNode } from 'react';

export default function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-[#181818]">
      <div className="border-b border-white/8 px-6 py-5">
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
