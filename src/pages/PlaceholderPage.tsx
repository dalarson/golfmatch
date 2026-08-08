import { PageIntro } from "../components/ui/PageIntro";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <section className="card">
        <p className="text-sm leading-6 text-slate-600">
          This route is ready for its feature implementation in a later milestone.
        </p>
      </section>
    </>
  );
}
