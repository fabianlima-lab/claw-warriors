const TESTIMONIALS = [
  { text: "Everything Siri was supposed to be. And it goes so much further.", author: "@crossiBuilds" },
  { text: "It's running my company.", author: "@therno" },
  { text: "Named him Jarvis. Daily briefings, calendar checks, reminds me when to leave for pickleball.", author: "@BraydonCoyer" },
];

export default function Testimonials() {
  return (
    <section className="py-16 px-6 text-center">
      <div className="flex gap-5 justify-center flex-wrap max-w-[900px] mx-auto">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="flex-1 min-w-[260px] max-w-[280px] bg-card border border-border rounded-[14px] p-5 text-left"
          >
            <p className="text-base text-txt leading-relaxed italic mb-3">
              &ldquo;{t.text}&rdquo;
            </p>
            <p className="text-[13px] text-accent font-semibold">{t.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
